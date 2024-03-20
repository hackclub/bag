import { BagService } from '../../gen/bag_connect'
import { findOrCreateIdentity, prisma } from '../db'
import { mappedPermissionValues } from '../permissions'
import { execute } from './routing'
import { ConnectRouter } from '@connectrpc/connect'
import { App, PermissionLevels } from '@prisma/client'

const getUser = async (slack: string, app: App) => {
  const identity = await findOrCreateIdentity(slack)
  if (mappedPermissionValues[app.permissions] < mappedPermissionValues.WRITE)
    identity.inventory = identity.inventory.filter(
      instance => app.specificItems.includes(instance.itemId) || instance.public
    )
  if (app.permissions === PermissionLevels.READ)
    identity.inventory = identity.inventory.filter(instance => instance.public)
  return identity
}

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.getIdentities, async req => {
    return await execute(req, async (req, app) => {
      let identities = await prisma.identity.findMany({
        where: JSON.parse(req.query) || {},
        include: { inventory: true }
      })
      if (
        mappedPermissionValues[app.permissions] < mappedPermissionValues.WRITE
      )
        identities = identities.map(identity => ({
          ...identity,
          inventory: identity.inventory.filter(
            instance =>
              app.specificItems.includes(instance.itemId) || instance.public
          )
        }))
      if (app.permissions === PermissionLevels.READ)
        identities = identities.map(identity => ({
          ...identity,
          inventory: identity.inventory.filter(instance => instance.public)
        }))
      return { identities }
    })
  })

  router.rpc(BagService, BagService.methods.getIdentity, async req => {
    return await execute(req, async (req, app) => {
      return { identity: await getUser(req.identityId, app) }
    })
  })

  router.rpc(BagService, BagService.methods.getInventory, async req => {
    return await execute(req, async (req, app) => {
      const user = await getUser(req.identityId, app)
      let inventory = user.inventory
      if (req.available) {
        // Update quantities by available
        for (let [i, instance] of inventory.entries()) {
          let quantityLeft = instance.quantity

          const otherTrades = await prisma.trade.findMany({
            where: {
              closed: false, // Not closed
              OR: [
                { initiatorTrades: { some: { instanceId: instance.id } } },
                { receiverTrades: { some: { instanceId: instance.id } } }
              ]
            },
            include: {
              initiatorTrades: true,
              receiverTrades: true
            }
          })
          const otherOffers = otherTrades.map(offer => ({
            ...offer,
            trades: [...offer.initiatorTrades, ...offer.receiverTrades]
          }))
          quantityLeft -= otherOffers.reduce((acc, curr) => {
            return (
              acc +
              curr.trades.find(trade => trade.instanceId === instance.id)
                .quantity
            )
          }, 0)
          if (quantityLeft <= 0) {
            inventory.splice(i, 1)
            continue
          }

          const crafting = await prisma.crafting.findFirst({
            where: {
              identityId: user.slack,
              recipeId: null
            },
            include: { inputs: true }
          })
          const inCrafting =
            crafting?.inputs.find(input => input.instanceId === instance.id)
              ?.quantity || 0
          if (quantityLeft - inCrafting <= 0) inventory.splice(i, 1)
          else inventory[i].quantity = quantityLeft
        }
      }
      return { inventory }
    })
  })

  router.rpc(
    BagService,
    BagService.methods.updateIdentityMetadata,
    async req => {
      return await execute(req, async (req, app) => {
        const identity = await findOrCreateIdentity(req.identityId)
        console.log(req.metadata)
        return {
          identity: await prisma.identity.update({
            where: { slack: req.identityId },
            data: {
              metadata: {
                ...(identity.metadata as object),
                ...JSON.parse(req.metadata)
              }
            }
          })
        }
      })
    }
  )
}
