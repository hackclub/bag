import { BagService } from '../../gen/bag_connect'
import { TradeWithTrades, prisma } from '../db'
import { mappedPermissionValues } from '../permissions'
import { execute } from './routing'
import { ConnectRouter } from '@connectrpc/connect'

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.createTrade, async req => {
    return await execute(req, async (req, app) => {
      const trade = await prisma.trade.create({
        data: {
          initiatorIdentityId: req.initiator,
          receiverIdentityId: req.receiver,
          public: req.public ? req.public : false
        }
      })

      if (
        mappedPermissionValues[app.permissions] <=
        mappedPermissionValues.WRITE_SPECIFIC
      )
        await prisma.app.update({
          where: { id: app.id },
          data: { specificTrades: { push: trade.id } }
        })

      return { trade }
    })
  })

  // TODO: Test
  router.rpc(BagService, BagService.methods.getTrade, async req => {
    return await execute(req, async (req, app) => {
      const trade = await prisma.trade.findUnique({
        where: { id: req.tradeId },
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

  // TODO: Test repeatedly
  router.rpc(BagService, BagService.methods.closeTrade, async req => {
    return await execute(req, async (req, app) => {
      let trade: TradeWithTrades = await prisma.trade.findUnique({
        where: { id: req.tradeId },
        include: { initiatorTrades: true, receiverTrades: true }
      })
      if (
        mappedPermissionValues[app.permissions] <=
          mappedPermissionValues.WRITE_SPECIFIC &&
        !app.specificTrades.find(tradeId => tradeId === trade.id)
      )
        throw new Error('Trade not found')

      // Transfer between users
      const initiator = await prisma.identity.findUnique({
        where: { slack: trade.initiatorIdentityId },
        include: { inventory: true }
      })
      const receiver = await prisma.identity.findUnique({
        where: { slack: trade.receiverIdentityId },
        include: { inventory: true }
      })

      if (req.cancel === true)
        // Close trade without transferring
        return {
          trade: await prisma.trade.update({
            where: { id: req.tradeId },
            data: { closed: true },
            include: { initiatorTrades: true, receiverTrades: true }
          }),
          initiator,
          receiver
        }

      await Promise.all(
        trade.initiatorTrades.map(async trade => {
          const instance = await prisma.instance.findUnique({
            where: { id: trade.instanceId }
          })
          if (trade.quantity < instance.quantity) {
            await prisma.instance.update({
              where: { id: instance.id },
              data: { quantity: instance.quantity - trade.quantity }
            })
            const receiverInstance = receiver.inventory.find(
              receiverInstance => receiverInstance.itemId === instance.itemId
            )
            if (receiverInstance)
              await prisma.instance.update({
                where: { id: receiverInstance.id },
                data: {
                  quantity: trade.quantity + receiverInstance.quantity
                }
              })
            else
              await prisma.instance.create({
                data: {
                  itemId: instance.itemId,
                  identityId: receiver.slack,
                  quantity: trade.quantity,
                  public: instance.public
                }
              })
          }
          // Transfer entire instance over
          else
            await prisma.instance.update({
              where: { id: instance.id },
              data: { identityId: receiver.slack }
            })
        })
      )
      await Promise.all(
        trade.receiverTrades.map(async trade => {
          const instance = await prisma.instance.findUnique({
            where: { id: trade.instanceId }
          })
          if (trade.quantity < instance.quantity) {
            await prisma.instance.update({
              where: { id: instance.id },
              data: { quantity: instance.quantity - trade.quantity }
            })
            const initiatorInstance = initiator.inventory.find(
              initiatorInstance => initiatorInstance.itemId === instance.itemId
            )
            if (initiatorInstance)
              await prisma.instance.update({
                where: { id: initiatorInstance.id },
                data: {
                  quantity: trade.quantity + initiatorInstance.quantity
                }
              })
            else
              await prisma.instance.create({
                data: {
                  itemId: instance.itemId,
                  identityId: initiator.slack,
                  quantity: trade.quantity,
                  public: instance.public
                }
              })
          }
          // Transfer entire instance over
          else
            await prisma.instance.update({
              where: { id: instance.id },
              data: { identityId: initiator.slack }
            })
        })
      )

      // Apps can close trades without both sides agreeing. This is so trades can be used to simulate other behavior
      let closed = await prisma.trade.update({
        where: { id: req.tradeId },
        data: { closed: true },
        include: { initiatorTrades: true, receiverTrades: true }
      })

      return {
        trade: closed,
        initiator,
        receiver
      }
    })
  })

  // TODO: Test repeatedly
  router.rpc(BagService, BagService.methods.updateTrade, async req => {
    return await execute(req, async (req, app) => {
      if (
        mappedPermissionValues[app.permissions] <=
          mappedPermissionValues.WRITE_SPECIFIC &&
        !app.specificTrades.find(tradeId => tradeId === req.tradeId)
      )
        throw new Error('Trade not found')

      let trade = await prisma.trade.findUnique({
        where: { id: req.tradeId },
        include: {
          initiatorTrades: true,
          receiverTrades: true
        }
      })
      if (!trade) throw new Error('Trade not found')
      if (
        ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
          req.identityId
        )
      )
        throw new Error('Identity not allowed to edit trade')

      const updateKey =
        trade.initiatorIdentityId === req.identityId
          ? 'initiatorTrades'
          : 'receiverTrades'

      // Add to trades, merging with ones that have already been added
      const crafting = await prisma.crafting.findFirst({
        where: {
          identityId: req.identityId,
          recipeId: null
        },
        include: { inputs: true }
      })

      for (let instance of req.add) {
        const search = trade[updateKey].find(
          add => add.instanceId === instance.id
        )
        const ref = await prisma.instance.findUnique({
          where: { id: instance.id },
          include: { item: true }
        })

        let quantityLeft = ref.quantity - instance.quantity

        // Deduct from crafting
        if (crafting) {
          const inCrafting = crafting.inputs.find(
            input => input.instanceId === instance.id
          )
          if (inCrafting) quantityLeft -= inCrafting.quantity
        }

        // Deduct from other trades
        const otherTrades = await prisma.trade.findMany({
          where: {
            closed: false, // Not closed
            OR: [
              {
                initiatorIdentityId: req.identityId,
                initiatorTrades: { some: { instanceId: instance.id } }
              },
              {
                receiverIdentityId: req.identityId,
                receiverTrades: { some: { instanceId: instance.id } }
              }
            ],
            NOT: [{ id: req.tradeId }]
          },
          include: {
            initiatorTrades: true,
            receiverTrades: true
          }
        })
        let otherOffers = otherTrades
          .map(offer => ({
            ...offer,
            trades: [...offer.initiatorTrades, ...offer.receiverTrades]
          }))
          .filter(offer =>
            offer.trades.find(trade => trade.instanceId === instance.id)
          )
          .reduce((acc, curr) => {
            return (
              acc -
              curr.trades.find(trade => trade.instanceId === instance.id)
                .quantity
            )
          }, quantityLeft)
        console.log('otherTrades', otherTrades)

        if (quantityLeft >= 0) {
          if (search) {
            await prisma.tradeInstance.update({
              where: { id: search.id },
              data: { quantity: search.quantity + instance.quantity }
            })
          } else {
            await prisma.tradeInstance.create({
              data: {
                instanceId: instance.id,
                quantity: instance.quantity,
                [updateKey]: {
                  connect: await prisma.trade.findUnique({
                    where: { id: req.tradeId }
                  })
                }
              }
            })
          }
        } else
          throw new Error(
            `Not enough ${ref.item.reaction} ${ref.item.name} to add to trade`
          )
      }

      trade = await prisma.trade.findUnique({
        where: { id: req.tradeId },
        include: {
          initiatorTrades: true,
          receiverTrades: true
        }
      })
      for (let instance of req.remove) {
        // Remove from trade
        const search = trade[updateKey].find(
          add => add.instanceId === instance.id
        )
        console.log(search)
        if (instance.quantity < search.quantity) {
          //Deduct from existing tradeInstance
          await prisma.tradeInstance.update({
            where: { id: search.id },
            data: { quantity: search.quantity - instance.quantity }
          })
        } else {
          // Completely remove trade
          await prisma.tradeInstance.delete({
            where: { id: search.id }
          })
        }
      }

      return {
        trade: await prisma.trade.findUnique({
          where: { id: req.tradeId },
          include: { initiatorTrades: true, receiverTrades: true }
        })
      }
    })
  })
}
