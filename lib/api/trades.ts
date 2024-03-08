import { BagService } from '../../gen/bag_connect'
import { TradeWithTrades, prisma } from '../db'
import { mappedPermissionValues } from '../permissions'
import { execute } from './routing'
import { ConnectRouter } from '@connectrpc/connect'
import { PermissionLevels } from '@prisma/client'

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.createTrade, async req => {
    return await execute(
      req,
      async (req, app) => {
        const trade = await prisma.trade.create({
          data: {
            initiatorIdentityId: req.initiator,
            receiverIdentityId: req.receiver,
            public: req.public ? req.public : false
          }
        })

        if (app.permissions === PermissionLevels.WRITE_SPECIFIC)
          await prisma.app.update({
            where: { id: app.id },
            data: { specificTrades: { push: trade.id } }
          })

        return { trade }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.readTrade, async req => {
    return await execute(req, async (req, app) => {
      const trade = await prisma.trade.findUnique({
        where: { id: req.tradeId },
        include: {
          initiatorTrades: true,
          receiverTrades: true
        }
      })

      if (!trade.public && app.permissions === PermissionLevels.READ)
        throw new Error('Trade not found')
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

  router.rpc(BagService, BagService.methods.closeTrade, async req => {
    return await execute(
      req,
      async (req, app) => {
        let trade: TradeWithTrades = await prisma.trade.findUnique({
          where: { id: req.tradeId },
          include: {
            initiatorTrades: true,
            receiverTrades: true
          }
        })
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
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

        await Promise.all(
          initiator.inventory.map(async instance => {
            const tradeInstance = trade.initiatorTrades.find(
              tradeInstance => tradeInstance.instanceId === instance.id
            )
            if (tradeInstance.quantity < instance.quantity) {
              await prisma.instance.update({
                where: { id: instance.id },
                data: { quantity: instance.quantity - tradeInstance.quantity }
              })
              await prisma.instance.create({
                data: {
                  itemId: instance.itemId,
                  identityId: receiver.slack,
                  quantity: tradeInstance.quantity,
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
          receiver.inventory.map(async instance => {
            const tradeInstance = trade.receiverTrades.find(
              tradeInstance => tradeInstance.instanceId === instance.id
            )
            if (tradeInstance.quantity < instance.quantity) {
              await prisma.instance.update({
                where: { id: instance.id },
                data: { quantity: instance.quantity - tradeInstance.quantity }
              })
              await prisma.instance.create({
                data: {
                  itemId: instance.itemId,
                  identityId: initiator.slack,
                  quantity: tradeInstance.quantity,
                  public: instance.public
                }
              })
            } else
              await prisma.instance.update({
                where: { id: instance.id },
                data: { identityId: initiator.slack }
              })
          })
        )

        // Apps can close trades without both sides agreeing. This is so trades can be used to simulate other behavior
        let closed = await prisma.trade.update({
          where: { id: req.tradeId },
          data: { closed: true }
        })

        return {
          trade: closed,
          initiator,
          receiver
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.updateTrade, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificTrades.find(tradeId => tradeId === req.tradeId)
        )
          throw new Error('Trade not found')

        const trade = await prisma.trade.findUnique({
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
        for (let instance of req.add) {
          // TODO
        }

        return {
          trade: await prisma.trade.findUnique({
            where: { id: req.tradeId }
          })
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })
}
