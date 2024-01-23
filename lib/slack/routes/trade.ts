import { IdentityWithInventory, findOrCreateIdentity } from '../../db'
import slack, { execute, receiver } from '../slack'
import { PrismaClient, Trade, Identity, Item } from '@prisma/client'
import { Block, KnownBlock, View } from '@slack/bolt'

const prisma = new PrismaClient()

slack.command('/trade', async props => {
  await execute(props, async props => {
    if (!/^<@[A-Z0-9]+\|[\d\w\s]+>$/gm.test(props.command.text))
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: 'To start a trade, run `/trade @<person>`!'
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
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: "Looks like you don't have any items to trade yet."
      })

    const receiver = await findOrCreateIdentity(
      props.command.text.slice(2, props.command.text.indexOf('|'))
    )
    if (!receiver.inventory.length)
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: `<@${receiver.slack}> doesn't have any items to trade yet! Perhaps you meant to run \`/give\` to give them a item.`
      })

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        initiatorIdentityId: props.context.userId,
        receiverIdentityId: receiver.slack
      }
    })

    const { channel, ts } = await props.client.chat.postMessage({
      channel: props.body.channel_id,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${user.slack}> just opened a trade with <@${receiver.slack}> with \`/trade ${props.command.text}\`.\n\nAdd and remove items; once you're satisfied, click on the "Accept trade" button to close the trade. Once both sides close the trade, the transfer will be made.`
          }
        },
        ...startTrade(trade.id)
      ]
    })

    await props.client.chat.update({
      channel,
      ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${user.slack}> just opened a trade with <@${receiver.slack}> with \`/trade ${props.command.text}\`.\n\nAdd and remove items; once you're satisfied, click on the "Accept trade" button to close the trade. Once both sides close the trade, the transfer will be made.`
          }
        },
        ...startTrade(trade.id, {
          channel,
          ts
        })
      ]
    })
  })
})

slack.action('update-trade', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { id, channel, ts } = JSON.parse(props.action.value)
    const trade = await prisma.trade.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      // @ts-expect-error
      return props.client.chat.postEphemeral({
        channel,
        user: props.body.user.id,
        text: "Oh no! You'll allowed to spectate on the trade and that's it."
      })

    // @ts-expect-error
    await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.body.trigger_id,
      view: await tradeDialog(props.body.user.id, trade.id, { channel, ts })
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

    const { tradeId, channel, ts } = JSON.parse(props.view.private_metadata)

    const instance = user.inventory.find(
      instance => instance.itemId === fields.item
    )
    const ref = await prisma.item.findUnique({
      where: {
        name: instance.itemId
      }
    })

    // Make sure quantity is not greater than the actual amount
    if (fields.quantity > instance.quantity)
      return props.client.chat.postEphemeral({
        channel,
        user: props.context.userId,
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

    const create = await prisma.tradeInstance.create({
      data: {
        instanceId: instance.id,
        quantity: Number(fields.quantity),
        [tradeKey]: { connect: trade }
      }
    })

    // Post in thread about trade
    await props.client.chat.postMessage({
      channel,
      thread_ts: ts,
      blocks: await addTrade(
        props.context.userId,
        trade.id,
        create.id,
        ref.name,
        fields.quantity,
        {
          channel,
          ts
        }
      )
    })
  })
})

slack.action('close-trade', async props => {
  await execute(props, async props => {
    // Close trade, transfer items between users
    // @ts-expect-error
    let { id, channel, ts } = JSON.parse(props.action.value)
    let trade = await prisma.trade.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      // @ts-expect-error
      return await props.client.chat.postEphemeral({
        channel,
        user: props.body.user.id,
        text: "Oh no! You can't close this trade."
      })

    const tradeKey =
      props.body.user.id === trade.initiatorIdentityId
        ? 'initiatorAgreed'
        : 'receiverAgreed'
    trade = await prisma.trade.update({
      where: {
        id
      },
      data: {
        [tradeKey]: true
      }
    })

    // Make sure both sides have agreed
    await props.say({
      thread_ts: ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${props.body.user.id}> accepted the trade!${
              !trade.initiatorAgreed || !trade.receiverAgreed
                ? ' Waiting for both sides to accept before transferring items.'
                : ''
            }`
          }
        }
      ]
    })
    if (!trade.initiatorAgreed || !trade.receiverAgreed) return

    // If both sides have agreed, close the trade
    const closed = await prisma.trade.update({
      where: { id },
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
    await Promise.all(
      initiator.inventory.map(async instance => {
        const tradeInstance = closed.initiatorTrades.find(
          tradeInstance => tradeInstance.instanceId === instance.id
        )
        if (tradeInstance) {
          if (tradeInstance.quantity < instance.quantity) {
            await prisma.instance.update({
              where: {
                id: instance.id
              },
              data: {
                quantity: instance.quantity - tradeInstance.quantity
              }
            })

            const existing = receiver.inventory.find(
              receiverInstance => receiverInstance.itemId === instance.itemId
            )
            if (existing !== undefined) {
              // Add to existing instance
              await prisma.instance.update({
                where: {
                  id: existing.id
                },
                data: {
                  quantity: existing.quantity + tradeInstance.quantity,
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
                  quantity: tradeInstance.quantity,
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
                where: {
                  id: existing.id
                },
                data: {
                  quantity: existing.quantity + tradeInstance.quantity,
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
      })
    )
    await Promise.all(
      receiver.inventory.map(async instance => {
        const tradeInstance = closed.receiverTrades.find(
          tradeInstance => tradeInstance.instanceId === instance.id
        )
        if (tradeInstance) {
          if (tradeInstance.quantity < instance.quantity) {
            await prisma.instance.update({
              where: {
                id: instance.id
              },
              data: {
                quantity: instance.quantity - tradeInstance.quantity
              }
            })

            const existing = initiator.inventory.find(
              initiatorInstance => initiatorInstance.itemId === instance.itemId
            )
            if (!existing !== undefined) {
              // Add to existing instance
              await prisma.instance.update({
                where: {
                  id: existing.id
                },
                data: {
                  quantity: existing.quantity + tradeInstance.quantity,
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
                  quantity: tradeInstance.quantity,
                  public: instance.public
                }
              })
          } else {
            // Transfer entire instance over
            const existing = initiator.inventory.find(
              initiatorInstance => initiatorInstance.itemId === instance.itemId
            )
            if (existing !== undefined) {
              // Add to existing instance
              await prisma.instance.update({
                where: {
                  id: existing.id
                },
                data: {
                  quantity: existing.quantity + tradeInstance.quantity,
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
      })
    )

    await props.respond({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `Trade between <@${closed.initiatorIdentityId}> and <@${closed.receiverIdentityId}> closed!`
          }
        }
      ]
    })
  })
})

slack.action('remove-trade', async props => {
  await execute(props, async props => {
    const { userId, tradeId, tradeInstanceId, itemId, quantity, ts } =
      JSON.parse(
        // @ts-expect-error
        props.action.value
      )

    const trade = await prisma.trade.findUnique({
      where: {
        id: tradeId
      }
    })
    if (trade.initiatorAgreed || trade.receiverAgreed)
      // @ts-expect-error
      return await props.client.chat.postEphemeral({
        thread_ts: ts,
        channel: props.body.channel.id,
        user: userId,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: "Can't remove a item once one side has accepted the trade!"
            }
          }
        ]
      })

    try {
      // Make sure trade hasn't been closed yet
      await prisma.tradeInstance.delete({
        where: {
          id: tradeInstanceId
        }
      })
    } catch {
      // @ts-expect-error
      return await props.client.chat.postEphemeral({
        thread_ts: ts,
        channel: props.body.channel.id,
        user: userId,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Item was already removed from trade!'
            }
          }
        ]
      })
    }

    const item = await prisma.item.findUnique({
      where: {
        name: itemId
      }
    })

    await props.say({
      thread_ts: ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${userId}> just removed x${quantity} of ${item.reaction} ${item.name} from the trade.`
          }
        }
      ]
    })
  })
})

const startTrade = (
  tradeId: number,
  thread?: object
): (Block | KnownBlock)[] => {
  return [
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Add from bag'
          },
          style: 'primary',
          value: JSON.stringify({
            id: tradeId,
            ...thread
          }),
          action_id: 'update-trade'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Accept trade',
            emoji: true
          },
          style: 'danger',
          value: JSON.stringify({
            id: tradeId,
            ...thread
          }),
          action_id: 'close-trade'
        }
      ]
    }
  ]
}

const tradeDialog = async (
  userId: string,
  tradeId: number,
  thread: { channel: string; ts: string }
): Promise<View> => {
  // TODO: Worry about having more than 100 items in inventory
  const user = await prisma.identity.findUnique({
    where: {
      slack: userId
    },
    include: {
      inventory: true
    }
  })

  return {
    callback_id: 'add-trade',
    title: {
      type: 'plain_text',
      text: 'Add from bag'
    },
    submit: {
      type: 'plain_text',
      text: 'Offer'
    },
    type: 'modal',
    private_metadata: JSON.stringify({ tradeId, ...thread }),
    blocks: [
      {
        type: 'input',
        element: {
          action_id: 'item',
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
                value: instance.itemId
              }
            })
          )
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
          min_value: '1'
        },
        label: {
          type: 'plain_text',
          text: 'Quantity'
        }
      }
    ]
  }
}

const addTrade = async (
  userId: string,
  tradeId: number,
  tradeInstanceId: number,
  itemId: string,
  quantity: number,
  thread: { channel: string; ts: number }
): Promise<(Block | KnownBlock)[]> => {
  const item = await prisma.item.findUnique({
    where: {
      name: itemId
    }
  })

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${userId}> offered x${quantity} of ${item.reaction} ${item.name}!`
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Take off trade'
          },
          action_id: 'remove-trade',
          value: JSON.stringify({
            userId,
            tradeId,
            tradeInstanceId,
            itemId,
            quantity,
            ...thread
          }),
          style: 'danger'
        }
      ]
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: '_You can only remove items off trades before the other trader closes their end._'
        }
      ]
    }
  ]
}
