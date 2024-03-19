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
      return { inventory: (await getUser(req.identityId, app)).inventory }
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
