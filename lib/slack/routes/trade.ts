import { IdentityWithInventory, findOrCreateIdentity } from '../../db'
import slack, { execute } from '../slack'
import { PrismaClient, Trade, Identity, Item, Instance } from '@prisma/client'
import { Block, KnownBlock, View } from '@slack/bolt'

const prisma = new PrismaClient()

slack.command('/bag-trade', async props => {
  await execute(props, async props => {
    if (!/^<@[A-Z0-9]+\|[\d\w\s]+>$/gm.test(props.command.text))
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: 'Oh no! You need to mention a user in order to start a trade with them.'
      })

    const receiver = await findOrCreateIdentity(
      props.command.text.slice(2, props.command.text.indexOf('|'))
    )

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        initiatorIdentityId: props.context.userId,
        receiverIdentityId: receiver.slack
      }
    })

    const { channel, ts } = await props.client.chat.postMessage({
      channel: props.body.channel_id,
      blocks: startTrade(props.context.userId, receiver.slack, trade)
    })

    await props.client.chat.update({
      channel,
      ts,
      blocks: startTrade(props.context.userId, receiver.slack, trade, {
        channel,
        ts
      })
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
      return props.say(
        "Oh no! You'll allowed to spectate on the trade and that's it."
      )

    // @ts-expect-error
    await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.body.trigger_id,
      view: await tradeDialog(
        await prisma.identity.findUnique({
          where: {
            slack: props.body.user.id
          },
          include: {
            inventory: true
          }
        }),
        trade.id,
        { channel, ts }
      )
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

    const {
      trade: tradeId,
      channel,
      ts
    } = JSON.parse(props.view.private_metadata)

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
      return props.client.chat.postMessage({
        channel: props.context.userId,
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
        : 'recieverTrades'

    const create = await prisma.tradeInstance.create({
      data: {
        instanceId: instance.id,
        quantity: Number(fields.quantity),
        [tradeKey]: { connect: trade }
      }
    })

    console.log(
      addTrade(user, create.id, ref, fields.quantity, { channel, ts })
    )

    // Post in thread about trade
    await props.client.chat.postMessage({
      channel,
      thread_ts: ts,
      blocks: addTrade(user, create.id, ref, fields.quantity, { channel, ts })
    })
  })
})

slack.action('close-trade', async props => {
  await execute(props, async props => {
    // Close trade, transfer items between users
    // @ts-expect-error
    let { id, channel, ts } = JSON.parse(props.action.value)
    id = Number(id)
    let trade = await prisma.trade.findUnique({
      where: { id }
    })

    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return await props.say("Oh no! You can't close this trade.")

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
    if (!trade.initiatorAgreed || !trade.receiverAgreed)
      return props.say({
        thread_ts: ts,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<@${props.body.user.id}> closed the trade! Waiting for both sides to close before transferring items.`
            }
          }
        ]
      })

    // If both sides have agreed, close the trade
    const closed = await prisma.trade.update({
      where: { id },
      data: { closed: true },
      include: {
        initiatorTrades: true,
        receiverTrades: true
      }
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

    // @ts-expect-error
    await props.client.chat.postMessage({
      channel,
      ts,
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
    const {
      user,
      trade,
      item: itemId,
      quantity,
      ts
      // @ts-expect-error
    } = JSON.parse(props.action.value)
    try {
      await prisma.tradeInstance.delete({
        where: {
          id: trade
        }
      })
    } catch {
      // @ts-expect-error
      return await props.client.chat.postEphemeral({
        thread_ts: ts,
        channel: props.body.channel.id,
        user: user,
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
            text: `<@${user}> just removed x${quantity} of ${item.reaction} ${item.name} from the trade.`
          }
        }
      ]
    })
  })
})

const startTrade = (
  initiator: string,
  receiver: string,
  trade: Trade,
  thread?: object
): (Block | KnownBlock)[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${initiator}> just opened a trade with <@${receiver}>.\n\n Add and remove items; once you're satisfied, click on the "Close trade" button to close the trade. Once both sides close the trade, the transfer will be made.`
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Add from inventory'
          },
          style: 'primary',
          value: JSON.stringify({
            id: trade.id.toString(),
            ...thread
          }),
          action_id: 'update-trade'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Close trade',
            emoji: true
          },
          style: 'danger',
          value: JSON.stringify({
            id: trade.id.toString(),
            ...thread
          }),
          action_id: 'close-trade'
        }
      ]
    }
  ]
}

const tradeDialog = async (
  user: IdentityWithInventory,
  trade: number,
  thread: { channel: string; ts: string }
): Promise<View> => {
  return {
    callback_id: 'add-trade',
    title: {
      type: 'plain_text',
      text: 'Add from inventory'
    },
    submit: {
      type: 'plain_text',
      text: 'Offer'
    },
    type: 'modal',
    private_metadata: JSON.stringify({ trade, ...thread }),
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

const addTrade = (
  user: Identity,
  trade: number,
  item: Item,
  quantity: number,
  thread: { channel: string; ts: string }
): (Block | KnownBlock)[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${user.slack}> offered x${quantity} of ${item.reaction} ${item.name}!`
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
            user: user.slack,
            trade,
            item: item.name,
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
