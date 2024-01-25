import { IdentityWithInventory, findOrCreateIdentity } from '../../db'
import slack, { execute, receiver } from '../slack'
import { PrismaClient } from '@prisma/client'
import { Block, Button, KnownBlock, View } from '@slack/bolt'

const prisma = new PrismaClient()

slack.command('/trade', async props => {
  await execute(props, async props => {
    if (!/^<@[A-Z0-9]+\|[\d\w\s]+>$/gm.test(props.command.text))
      return await props.respond({
        response_type: 'ephemeral',
        text: 'To start a trade, run `/trade @<person>`!'
      })
    else if (
      props.context.userId ==
      props.command.text.slice(2, props.command.text.indexOf('|'))
    )
      return await props.respond({
        response_type: 'ephemeral',
        text: "Erm, you can't really trade with yourself..."
      })

    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      },
      include: {
        inventory: true
      }
    })
    if (!user.inventory.length)
      return await props.respond({
        response_type: 'ephemeral',
        text: "Looks like you don't have any items to trade yet."
      })

    const receiver = await findOrCreateIdentity(
      props.command.text.slice(2, props.command.text.indexOf('|'))
    )
    if (!receiver.inventory.length)
      return await props.respond({
        response_type: 'ephemeral',
        text: `<@${receiver.slack}> doesn't have any items to trade yet! Perhaps you meant to run \`/give\` to give them a item.`
      })

    if (
      (
        await prisma.trade.findMany({
          where: {
            initiatorIdentityId: props.context.userId,
            receiverIdentityId: receiver.slack,
            closed: false
          }
        })
      ).length ||
      (
        await prisma.trade.findMany({
          where: {
            initiatorIdentityId: receiver.slack,
            receiverIdentityId: props.context.userId,
            closed: false
          }
        })
      ).length
    )
      return await props.respond({
        response_type: 'ephemeral',
        text: `You're already in an open trade with <@${receiver.slack}>.`
      })

    // Initiator should first select an item
    await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: await startTrade(user.slack, receiver.slack, props.body.channel_id)
    })
  })
})

slack.view('start-trade', async props => {
  await execute(props, async props => {
    let fields: {
      instance: number
      quantity: number
    } = {
      instance: undefined,
      quantity: 1
    }
    for (let field of Object.values(props.view.state.values))
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]].value ||
        Object.values(field)[0].selected_option.value ||
        ''

    const { receiverId, channel: openChannel } = JSON.parse(
      props.view.private_metadata
    )

    const tradeInstance = await prisma.tradeInstance.create({
      data: {
        instanceId: Number(fields.instance),
        quantity: Number(fields.quantity)
      }
    })

    const trade = await prisma.trade.create({
      data: {
        initiatorIdentityId: props.context.userId,
        receiverIdentityId: receiverId,
        initiatorTrades: { connect: tradeInstance }
      }
    })

    console.log(openChannel)
    const { channel, ts } = await props.client.chat.postMessage({
      channel: openChannel,
      blocks: await showTrade(props.context.userId, receiverId, trade.id)
    })

    await props.client.chat.update({
      channel,
      ts,
      blocks: await showTrade(props.context.userId, receiverId, trade.id, {
        channel,
        ts
      })
    })
  })
})

slack.action('edit-offer', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { tradeId, channel, ts } = JSON.parse(props.action.value)

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    })
    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! You'll allowed to spectate on the trade and that's it."
      })

    // @ts-expect-error
    await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.body.trigger_id,
      view: await tradeDialog(props.body.user.id, tradeId, { channel, ts })
    })
  })
})

slack.action('decline-trade', async props => {
  await execute(props, async props => {
    // Close trade
    // @ts-expect-error
    const { tradeId, channel, ts } = JSON.parse(props.action.value)
    let trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    })

    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return await props.respond({
        response_type: 'ephemeral',
        text: "Woah woah woah! You'll allowed to spectate on the trade and that's it."
      })

    trade = await prisma.trade.update({
      where: {
        id: tradeId
      },
      data: {
        closed: true
      }
    })

    // @ts-expect-error
    await props.client.chat.update({
      channel,
      ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${props.body.user.id}> declined to trade with <@${
              props.body.user.id === trade.initiatorIdentityId
                ? trade.receiverIdentityId
                : trade.initiatorIdentityId
            }>.`
          }
        }
      ]
    })
  })
})

slack.action('accept-trade', async props => {
  await execute(props, async props => {
    // Close trade, transfer items between users
    // @ts-expect-error
    let { tradeId, channel, ts } = JSON.parse(props.action.value)
    let trade = await prisma.trade.findUnique({
      where: {
        id: Number(tradeId)
      }
    })

    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return await props.respond({
        response_type: 'ephemeral',
        text: "Woah woah woah! You'll allowed to spectate on the trade and that's it."
      })

    const tradeKey =
      props.body.user.id === trade.initiatorIdentityId
        ? 'initiatorAgreed'
        : 'receiverAgreed'
    trade = await prisma.trade.update({
      where: {
        id: tradeId
      },
      data: {
        [tradeKey]: true
      }
    })

    // Make sure both sides have agreed
    if (!trade.initiatorAgreed || !trade.receiverAgreed) {
      await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: `Cool! Waiting for <@${
          props.body.user.id === trade.initiatorIdentityId
            ? trade.receiverIdentityId
            : trade.initiatorIdentityId
        }> to accept.`
      })
      try {
        // @ts-expect-error
        await props.client.chat.postEphemeral({
          channel,
          ts,
          user:
            props.body.user.id === trade.initiatorIdentityId
              ? trade.receiverIdentityId
              : trade.initiatorIdentityId,
          text: `<@${props.body.user.id}> just accepted the trade and is waiting for you to accept or decline.`
        })
      } catch {}
      // @ts-expect-error
      return await props.client.chat.update({
        channel,
        ts,
        blocks: await showTrade(
          trade.initiatorIdentityId,
          trade.receiverIdentityId,
          trade.id,
          { channel, ts }
        )
      })
    }

    // If both sides have agreed, close the trade
    const closed = await prisma.trade.update({
      where: { id: tradeId },
      data: { closed: true },
      include: { initiatorTrades: true, receiverTrades: true }
    })

    const initiator = await prisma.identity.findUnique({
      where: {
        slack: trade.initiatorIdentityId
      },
      include: {
        inventory: true
      }
    })
    const receiver = await prisma.identity.findUnique({
      where: {
        slack: trade.receiverIdentityId
      },
      include: {
        inventory: true
      }
    })

    // Now transfer items
    for (let trade of closed.initiatorTrades) {
      const instance = await prisma.instance.findUnique({
        where: { id: trade.instanceId }
      })
      if (trade.quantity < instance.quantity) {
        await prisma.instance.update({
          where: { id: instance.id },
          data: { quantity: instance.quantity - trade.quantity }
        })

        const existing = receiver.inventory.find(
          receiverInstance => receiverInstance.itemId === instance.itemId
        )
        if (existing !== undefined) {
          // Add to existing instance
          await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + trade.quantity,
              metadata: instance.metadata
                ? {
                    ...(existing.metadata as object),
                    ...(instance.metadata as object)
                  }
                : existing.metadata
            }
          })
        } else
          await prisma.instance.create({
            data: {
              itemId: instance.itemId,
              identityId: receiver.slack,
              quantity: trade.quantity,
              public: instance.public
            }
          })
      } else {
        // Transfer entire instance over
        const existing = receiver.inventory.find(
          receiverInstance => receiverInstance.itemId === instance.itemId
        )
        if (existing !== undefined) {
          // Add to existing instance
          await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + trade.quantity,
              metadata: instance.metadata
                ? {
                    ...(existing.metadata as object),
                    ...(instance.metadata as object)
                  }
                : existing.metadata
            }
          })
        } else
          await prisma.instance.update({
            where: {
              id: instance.id
            },
            data: {
              identityId: receiver.slack
            }
          })
      }
    }

    for (let trade of closed.receiverTrades) {
      const instance = await prisma.instance.findUnique({
        where: { id: trade.instanceId }
      })
      if (trade.quantity < instance.quantity) {
        await prisma.instance.update({
          where: { id: instance.id },
          data: { quantity: instance.quantity - trade.quantity }
        })

        const existing = initiator.inventory.find(
          initiatorInstance => initiatorInstance.itemId === instance.itemId
        )
        if (existing !== undefined) {
          // Add to existing instance
          await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + trade.quantity,
              metadata: instance.metadata
                ? {
                    ...(existing.metadata as object),
                    ...(instance.metadata as object)
                  }
                : existing.metadata
            }
          })
        } else
          await prisma.instance.create({
            data: {
              itemId: instance.itemId,
              identityId: initiator.slack,
              quantity: trade.quantity,
              public: instance.public
            }
          })
      } else {
        // Transfer entire instance over
        const existing = initiator.inventory.find(
          receiverInstance => receiverInstance.itemId === instance.itemId
        )
        if (existing !== undefined) {
          // Add to existing instance
          await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + trade.quantity,
              metadata: instance.metadata
                ? {
                    ...(existing.metadata as object),
                    ...(instance.metadata as object)
                  }
                : existing.metadata
            }
          })
        } else
          await prisma.instance.update({
            where: {
              id: instance.id
            },
            data: {
              identityId: initiator.slack
            }
          })
      }
    }

    // @ts-expect-error
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showTrade(
        initiator.slack,
        receiver.slack,
        trade.id,
        { channel, ts },
        true
      )
    })
  })
})

slack.action('remove-trade', async props => {
  await execute(props, async props => {
    // Remove from the trade
    const { tradeInstanceId, tradeId, channel, ts } = JSON.parse(
      // @ts-expect-error
      props.action.value
    )
    const trade = await prisma.trade.findUnique({
      where: {
        id: tradeId
      }
    })

    await prisma.tradeInstance.delete({
      where: {
        id: tradeInstanceId
      }
    })

    // @ts-expect-error
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showTrade(
        trade.initiatorIdentityId,
        trade.receiverIdentityId,
        tradeId,
        { channel, ts }
      )
    })

    // @ts-expect-error
    await props.client.views.update({
      external_id: `${props.body.user.id}-${tradeId}`,
      view: await tradeDialog(props.body.user.id, tradeId, { channel, ts })
    })
  })
})

slack.view('add-trade', async props => {
  await execute(props, async props => {
    const user = await prisma.identity.findUnique({
      where: {
        slack: props.body.user.id
      },
      include: {
        inventory: true
      }
    })

    let fields: {
      item: string
      quantity: number
    } = {
      item: undefined,
      quantity: 1
    }
    for (let field of Object.values(props.view.state.values))
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]].value ||
        Object.values(field)[0].selected_option.value ||
        ''

    const instance = user.inventory.find(
      instance => instance.itemId === fields.item
    )
    const ref = await prisma.item.findUnique({
      where: {
        name: instance.itemId
      }
    })

    const { tradeId, channel, ts } = JSON.parse(props.view.private_metadata)

    // Make sure quantity is not greater than the actual amount
    if (fields.quantity > instance.quantity)
      return await props.respond({
        response_type: 'ephemeral',
        text: `Woah woah woah! It doesn't look like you have ${fields.quantity} ${ref.reaction} ${ref.name} to trade.`
      })

    // Add to trade by creating instance
    const trade = await prisma.trade.findUnique({
      where: {
        id: tradeId
      }
    })
    const tradeKey =
      user.slack === trade.initiatorIdentityId
        ? 'initiatorTrades'
        : 'receiverTrades'

    await prisma.tradeInstance.create({
      data: {
        instanceId: instance.id,
        quantity: Number(fields.quantity),
        [tradeKey]: { connect: trade }
      }
    })

    // Update thread
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showTrade(
        trade.initiatorIdentityId,
        trade.receiverIdentityId,
        trade.id,
        {
          channel,
          ts
        }
      )
    })
  })
})

const tradeDialog = async (
  userId: string,
  tradeId: number,
  thread?: { channel: string; ts: string }
): Promise<View> => {
  const user = await prisma.identity.findUnique({
    where: {
      slack: userId
    },
    include: {
      inventory: true
    }
  })

  const trade = await prisma.trade.findUnique({
    where: {
      id: tradeId
    },
    include: {
      initiatorTrades: true,
      receiverTrades: true
    }
  })
  const tradeKey =
    trade.initiatorIdentityId === userId ? 'initiatorTrades' : 'receiverTrades'
  const currentTrades = trade[tradeKey]

  let offering = []
  let notOffering = []
  await Promise.all(
    user.inventory.map(async instance => {
      // Check if offering
      const tradeInstance = currentTrades.find(
        tradeInstance => tradeInstance.instanceId === instance.id
      )
      const ref = await prisma.item.findUnique({
        where: { name: instance.itemId }
      })
      if (tradeInstance) {
        offering.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `x${tradeInstance.quantity} ${ref.reaction} ${ref.name}`
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Remove'
            },
            value: JSON.stringify({
              tradeInstanceId: tradeInstance.id,
              tradeId,
              ...thread
            }),
            action_id: 'remove-trade'
          }
        })
      } else {
        // Check to make sure it's not being offered in another trade
        // const beingOffered = await prisma.trade.findFirst({
        //   where: {
        //     closed: false, // Not closed
        //     OR: [
        //       { initiatorTrades: { some: { id: instance.id } } },
        //       {
        //         receiverTrades: { some: { id: instance.id } }
        //       }
        //     ] // Either in initiatorTrades or receiverTrades
        //   }
        // })
        notOffering.push({
          text: {
            type: 'plain_text',
            text: `x${instance.quantity} ${ref.reaction} ${ref.name}`
          },
          value: instance.itemId
        })
      }
    })
  )

  return {
    callback_id: 'add-trade',
    title: {
      type: 'plain_text',
      text: 'Edit trade'
    },
    submit: {
      type: 'plain_text',
      text: 'Add to trade'
    },
    close: {
      type: 'plain_text',
      text: 'Close window'
    },
    type: 'modal',
    private_metadata: JSON.stringify({ tradeId, ...thread }),
    external_id: `${user.slack}-${tradeId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "*You're offering:*"
        }
      },
      ...(offering.length
        ? offering
        : [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '_Nothing yet._'
              }
            }
          ]),
      {
        type: 'input',
        element: {
          action_id: 'item',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Add an item'
          },
          options: notOffering
        },
        label: {
          type: 'plain_text',
          text: 'Add item to trade'
        }
      },
      {
        type: 'input',
        element: {
          type: 'number_input',
          is_decimal_allowed: false,
          action_id: 'quantity',
          min_value: '1',
          initial_value: '1'
        },
        label: {
          type: 'plain_text',
          text: 'Quantity'
        }
      }
    ]
  }
}

const startTrade = async (
  giverId: string,
  receiverId: string,
  channel: string
): Promise<View> => {
  const user = await prisma.identity.findUnique({
    where: {
      slack: giverId
    },
    include: {
      inventory: true
    }
  })

  return {
    callback_id: 'start-trade',
    title: {
      type: 'plain_text',
      text: 'Start trade'
    },
    submit: {
      type: 'plain_text',
      text: 'Start trade'
    },
    type: 'modal',
    private_metadata: JSON.stringify({ receiverId, channel }),
    blocks: [
      {
        type: 'input',
        element: {
          action_id: 'instance',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Choose a item'
          },
          options: await Promise.all(
            user.inventory.map(async instance => {
              const item = await prisma.item.findUnique({
                where: {
                  name: instance.itemId
                }
              })

              return {
                text: {
                  type: 'plain_text',
                  text: `x${instance.quantity} ${item.reaction} ${instance.itemId}`,
                  emoji: true
                },
                value: instance.id.toString()
              }
            })
          )
        },
        label: {
          type: 'plain_text',
          text: 'Choose an initial item'
        }
      },
      {
        type: 'input',
        element: {
          type: 'number_input',
          is_decimal_allowed: false,
          action_id: 'quantity',
          min_value: '1',
          initial_value: '1'
        },
        label: {
          type: 'plain_text',
          text: 'Quantity'
        }
      }
    ]
  }
}

const showTrade = async (
  giverId: string,
  receiverId: string,
  tradeId: number,
  thread?: { channel: string; ts: string },
  closed?: boolean
): Promise<(Block | KnownBlock)[]> => {
  const trade = await prisma.trade.findUnique({
    where: {
      id: tradeId
    },
    include: {
      initiatorTrades: true,
      receiverTrades: true
    }
  })

  const giverTrades = await Promise.all(
    trade.initiatorTrades.map(async tradeInstance => {
      const instance = await prisma.instance.findUnique({
        where: {
          id: tradeInstance.instanceId
        },
        include: {
          item: true
        }
      })

      return `x${tradeInstance.quantity} ${instance.item.reaction} ${instance.item.name}`
    })
  )

  const receiverTrades = await Promise.all(
    trade.receiverTrades.map(async tradeInstance => {
      const instance = await prisma.instance.findUnique({
        where: { id: tradeInstance.instanceId },
        include: { item: true }
      })

      return `x${tradeInstance.quantity} ${instance.item.reaction} ${instance.item.name}`
    })
  )

  let actions: Button[] = []
  if (!trade.initiatorAgreed && !trade.receiverAgreed)
    actions.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Edit offer'
      },
      action_id: 'edit-offer',
      value: JSON.stringify({
        tradeId,
        ...thread
      }),
      style: 'primary'
    })
  if (!closed)
    actions.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Decline trade'
      },
      value: JSON.stringify({ tradeId, ...thread }),
      action_id: 'decline-trade',
      style: 'danger'
    })
  if (!closed && trade.initiatorTrades.length && trade.receiverTrades.length)
    actions.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Accept trade'
      },
      value: JSON.stringify({ tradeId, ...thread }),
      action_id: 'accept-trade',
      style: 'primary'
    })

  let blocks: (Block | KnownBlock)[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: closed
          ? `<@${giverId}> closed a trade with <@${receiverId}>. <@${receiverId}> received:`
          : `<@${giverId}> has proposed a trade with <@${receiverId}>, offering:`
      }
    },
    giverTrades.length
      ? {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: giverTrades.join('\n')
          }
        }
      : {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '_Nothing yet._'
          }
        },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: closed
          ? `In exchange, <@${giverId}> received:`
          : `In exchange, <@${receiverId}> offers:`
      }
    },
    receiverTrades.length
      ? {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: receiverTrades.join('\n')
          }
        }
      : {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '_Nothing yet._'
          }
        }
  ]
  if (!closed)
    blocks.push({
      type: 'actions',
      elements: actions
    })
  return blocks
}
