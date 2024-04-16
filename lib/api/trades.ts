import { BagService } from '../../gen/bag_connect'
import { TradeWithTrades, prisma } from '../db'
import { mappedPermissionValues } from '../permissions'
import { execute } from './routing'
import { web } from './routing'
import { ConnectRouter } from '@connectrpc/connect'
import { PermissionLevels } from '@prisma/client'
import { Block, KnownBlock } from '@slack/bolt'

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.createTrade, async req => {
    return await execute('create-trade', req, async (req, app) => {
      const exists = await prisma.trade.findFirst({
        where: {
          OR: [
            {
              initiatorIdentityId: req.initiator,
              receiverIdentityId: req.receiver
            },
            {
              initiatorIdentityId: req.receiver,
              receiverIdentityId: req.initiator
            }
          ]
        }
      })
      if (exists) throw new Error('Trade already open')

      const message = (thread?): (Block | KnownBlock)[] => [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${app.name}* proposed a trade between you and <@${req.receiver}>. Accept or decline:`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Accept'
              },
              style: 'primary',
              action_id: 'bot-create-trade',
              value: JSON.stringify({
                req,
                id: app.id,
                thread: thread || undefined
              })
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Decline'
              },
              style: 'danger',
              action_id: 'bot-decline-trade',
              value: JSON.stringify({
                req,
                id: app.id,
                thread: thread || undefined
              })
            }
          ]
        }
      ]

      // Since we don't have permissions for either user (we could but we're not aware of that), we open a thread asking each user to confirm this interaction
      const initiator = await web.chat.postMessage({
        channel: req.initiator,
        username: req.initiator,
        blocks: message()
      })

      const receiver = await web.chat.postMessage({
        channel: req.receiver,
        username: req.receiver,
        blocks: message()
      })

      await web.chat.update({
        channel: req.initiator,
        ts: initiator.ts,
        blocks: message({
          channel: req.receiver,
          ts: receiver.ts
        })
      })

      await web.chat.update({
        channel: req.receiver,
        ts: receiver.ts,
        blocks: message({
          channel: req.initiator,
          ts: initiator.ts
        })
      })

      return { initiated: true }
    })
  })

  router.rpc(BagService, BagService.methods.getTrade, async req => {
    return await execute('get-trade', req, async (req, app) => {
      const trade = await prisma.trade.findFirst({
        where: { ...req.query },
        include: {
          initiatorTrades: {
            include: {
              instance: true
            }
          },
          receiverTrades: {
            include: {
              instance: true
            }
          }
        }
      })

      if (
        !trade.public &&
        mappedPermissionValues[app.permissions] <
          mappedPermissionValues.WRITE &&
        !app.specificTrades.find(tradeId => tradeId === trade.id)
      )
        throw new Error('Trade not found')

      return { trade }
    })
  })

  router.rpc(BagService, BagService.methods.getTrades, async req => {
    return await execute('get-trades', req, async (req, app) => {
      if (!req.query.initiatorTrades.length) delete req.query.initiatorTrades
      if (!req.query.receiverTrades.length) delete req.query.receiverTrades

      const trades = await prisma.trade.findMany({
        where: { ...req.query },
        include: {
          initiatorTrades: {
            include: { instance: true }
          },
          receiverTrades: {
            include: { instance: true }
          }
        }
      })

      console.log(trades)

      return {
        trades: trades.filter(trade => {
          if (!trade.public && app.permissions === PermissionLevels.READ)
            return false
          if (
            !app.specificTrades.find(tradeId => tradeId === trade.id) &&
            mappedPermissionValues[app.permissions] <
              mappedPermissionValues.WRITE
          )
            return false
          return true
        })
      }
    })
  })

  router.rpc(BagService, BagService.methods.closeTrade, async req => {
    return await execute('close-trade', req, async (req, app) => {
      const trade = await prisma.trade.findUnique({
        where: {
          id: req.tradeId
        },
        include: {
          initiatorTrades: true,
          receiverTrades: true
        }
      })

      if (req.cancel && app.specificTrades.find(id => id === trade.id)) {
        // Can cancel trades that app has permission to without asking
        const canceled = await prisma.trade.delete({
          where: { id: trade.id },
          include: {
            initiator: true,
            receiver: true
          }
        })

        return {
          trade: canceled,
          initiator: canceled.initiator,
          receiver: canceled.receiver
        }
      } else if (
        !req.cancel &&
        ((mappedPermissionValues[app.permissions] <=
          mappedPermissionValues.WRITE_SPECIFIC &&
          app.specificTrades.find(id => id === trade.id)) ||
          mappedPermissionValues[app.permissions] >=
            mappedPermissionValues.WRITE)
      ) {
        // If app has permissions, still needs to confirm
        let initiatorTrades = []
        let receiverTrades = []

        for (let offer of trade.initiatorTrades) {
          const ref = await prisma.instance.findUnique({
            where: { id: offer.instanceId },
            include: { item: true }
          })
          initiatorTrades.push(
            `x${offer.quantity} ${ref.item.reaction} ${ref.item.name}`
          )
        }

        for (let offer of trade.receiverTrades) {
          const ref = await prisma.instance.findUnique({
            where: { id: offer.instanceId },
            include: { item: true }
          })
          receiverTrades.push(
            `x${offer.quantity} ${ref.item.reaction} ${ref.item.name}`
          )
        }

        const message = (side, thread?): (Block | KnownBlock)[] => {
          if (side === 'receiver') {
            return [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${
                    app.name
                  }* would like to close a trade between you and <@${
                    trade.initiatorIdentityId
                  }>. Here's what you're trading:\n\n${
                    receiverTrades.length
                      ? receiverTrades.join('\n')
                      : '_Nothing._'
                  }\n\nHere's what <@${
                    trade.receiverIdentityId
                  }> is trading:\n\n${
                    initiatorTrades.length
                      ? initiatorTrades.join('\n')
                      : '_Nothing._'
                  }\n\nAccept or decline:`
                }
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'Accept'
                    },
                    style: 'primary',
                    action_id: 'bot-close-trade',
                    value: JSON.stringify({
                      req,
                      id: app.id,
                      thread: thread || undefined
                    })
                  },
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'Decline'
                    },
                    style: 'danger',
                    action_id: 'bot-decline-close-trade',
                    value: JSON.stringify({
                      req,
                      id: app.id,
                      thread: thread || undefined
                    })
                  }
                ]
              }
            ]
          } else
            return [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${
                    app.name
                  }* would like to close a trade between you and <@${
                    trade.receiverIdentityId
                  }>. Here's what you're trading:\n\n${
                    initiatorTrades.length
                      ? initiatorTrades.join('\n')
                      : '_Nothing._'
                  }\n\nHere's what <@${
                    trade.receiverIdentityId
                  }> is trading:\n\n${
                    receiverTrades.length
                      ? receiverTrades.join('\n')
                      : '_Nothing._'
                  }\n\nAccept or decline:`
                }
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'Accept'
                    },
                    style: 'primary',
                    action_id: 'bot-close-trade',
                    value: JSON.stringify({
                      req,
                      id: app.id,
                      thread: thread || undefined
                    })
                  },
                  {
                    type: 'button',
                    text: {
                      type: 'plain_text',
                      text: 'Decline'
                    },
                    style: 'danger',
                    action_id: 'bot-decline-close-trade',
                    value: JSON.stringify({
                      req,
                      id: app.id,
                      thread: thread || undefined
                    })
                  }
                ]
              }
            ]
        }

        const initiator = await web.chat.postMessage({
          channel: trade.initiatorIdentityId,
          username: trade.initiatorIdentityId,
          blocks: message('initiator')
        })

        const receiver = await web.chat.postMessage({
          channel: trade.receiverIdentityId,
          username: trade.receiverIdentityId,
          blocks: message('receiver')
        })

        await web.chat.update({
          channel: trade.initiatorIdentityId,
          ts: initiator.ts,
          blocks: message(receiver.ts)
        })

        await web.chat.update({
          channel: trade.receiverIdentityId,
          ts: receiver.ts,
          blocks: message(initiator.ts)
        })

        return { initiated: true }
      }

      throw new Error("App doesn't have permissions to close that trade")
    })
  })

  router.rpc(BagService, BagService.methods.updateTrade, async req => {
    return await execute('update-trade', req, async (req, app) => {
      if (
        mappedPermissionValues[app.permissions] <=
          mappedPermissionValues.WRITE_SPECIFIC &&
        !app.specificTrades.find(id => id === req.tradeId)
      )
        throw new Error("App doesn't have permissions to update that trade")

      const trade = await prisma.trade.findUnique({
        where: {
          id: req.tradeId
        },
        include: {
          initiatorTrades: true,
          receiverTrades: true
        }
      })

      if (
        ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
          req.identityId
        )
      )
        throw new Error("Identity doesn't have access to update that trade")

      const identity = await prisma.identity.findUnique({
        where: {
          slack: req.identityId
        },
        include: {
          inventory: {
            include: {
              item: true
            }
          }
        }
      })

      const updateKey =
        trade.initiatorIdentityId === req.identityId
          ? 'initiatorTrades'
          : 'receiverTrades'

      let additions = []
      let removals = []

      // Make sure req.add can be added and req.remove can be removed
      for (let instance of req.add) {
        const inInventory = identity.inventory.find(i => i.id === instance.id)
        if (!inInventory)
          throw new Error(
            `Identity doesn't have access to instance ${instance.id}`
          )
        const enough = await quantityLeft(instance.id)
        if (enough < 1)
          throw new Error(`Not enough of instance ${instance.id} to offer`)
        additions.push(
          `x${instance.quantity} ${inInventory.item.reaction} ${inInventory.item.name}`
        )
      }

      for (let instance of req.remove) {
        if (!trade[updateKey].find(offer => offer.instanceId === instance.id))
          throw new Error(`Instance ${instance.id} not in trade`)
        const inInventory = identity.inventory.find(i => i.id === instance.id)
        if (!inInventory)
          throw new Error(
            `Identity doesn't have access to instance ${instance.id}`
          )
        removals.push(
          `x${instance.quantity} ${inInventory.item.reaction} ${inInventory.item.name}`
        )
      }

      // Ask for permissions
      await web.chat.postMessage({
        channel: req.identityId,
        username: req.identityId,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${
                app.name
              }* proposed the following additions and removals from your inventory:\n\nAdditions: ${
                additions.length ? '\n' + additions.join('\n') : '_Nothing._'
              }\n\nRemovals: ${
                removals.length ? '\n' + removals.join('\n') : '_Nothing._'
              }`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Accept'
                },
                style: 'primary',
                action_id: 'bot-update-trade',
                value: JSON.stringify({
                  req,
                  id: app.id
                })
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Decline'
                },
                style: 'danger',
                action_id: 'bot-decline-update-trade',
                value: JSON.stringify({
                  req,
                  id: app.id
                })
              }
            ]
          }
        ]
      })

      return { initiated: true }
    })
  })
}

const quantityLeft = async (id: number) => {
  const instance = await prisma.instance.findUnique({
    where: { id }
  })

  let quantityLeft = instance.quantity

  const crafting = await prisma.crafting.findFirst({
    where: {
      done: false,
      inputs: {
        some: { id: instance.id }
      }
    },
    include: {
      inputs: true
    }
  })

  if (crafting) {
    const input = crafting.inputs.find(
      input => input.instanceId === instance.id
    )
    if (input) quantityLeft -= input.quantity
  }

  const trades = await prisma.trade.findMany({
    where: {
      OR: [
        { initiatorTrades: { some: { instanceId: instance.id } } },
        { receiverTrades: { some: { instanceId: instance.id } } }
      ],
      closed: false
    },
    include: {
      initiatorTrades: true,
      receiverTrades: true
    }
  })

  for (let trade of trades) {
    const offers = [...trade.initiatorTrades, ...trade.receiverTrades]
    const ref = offers.find(offer => offer.instanceId === instance.id)
    if (ref) quantityLeft -= ref.quantity
  }

  return quantityLeft
}
