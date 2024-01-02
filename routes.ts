import { ConnectRouter } from '@connectrpc/connect'
import { ElizaService } from './gen/eliza_connect'
import slack from './lib/slack/routes'
import { log, err } from './lib/logger'
import { Apps, Items } from './lib/db'
import { mappedPermissionValues } from './lib/permissions'
import { PermissionLevels } from '@prisma/client'

export async function execute(
  req: any,
  func: (req: any, app: Apps) => any,
  permission?: number
) {
  try {
    let app = await Apps.find({ id: req.appId, AND: [{ key: req.key }] })
    if (!app) throw new Error('App not found or invalid app key')
    if (mappedPermissionValues[app.permissions] < permission) return
    const result = await func(req, app)
    return result
  } catch (error) {
    err(error)
    return { response: error.toString() }
  }
}

export default (router: ConnectRouter) => {
  router.rpc(ElizaService, ElizaService.methods.createApp, async req => {
    return await execute(req, async (req, app) => {
      if (app.permissions !== PermissionLevels.ADMIN)
        throw new Error('Invalid permissions')
      const created = await Apps.create(
        req.name,
        req.description,
        req.permissions
      )
      await created.update({
        public: req.public,
        metadata: JSON.parse(req.metadata)
      })
      return { app: created }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.createInstance, async req => {
    return await execute(req, async (req, app) => {
      const item = await Items.find({ name: req.itemId })
      if (!item) throw new Error('Item not found')

      // Make sure app has permissions to assign specific item
      if (
        mappedPermissionValues[app.permissions] <
        mappedPermissionValues.WRITE_SPECIFIC
      )
        throw new Error(
          'App does not have the minimum permissions to be able to create instances; please request permissions for your app in Slack by running /edit-app <id> <key> and requesting a new permission level.'
        )
      else if (mappedPermissionValues.WRITE_SPECIFIC) {
        console.log(app.specific)
        return { response: 'still tryna figure it out man' }
      }

      return { id: 1, itemId: 'hi', identityId: 'hi' }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.createItem, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.createRecipe, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.createTrade, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.readIdentity, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.readInventory, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.readItem, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.readApp, async req => {
    return await execute(req, async (req, app) => {
      const appSearch = await Apps.find({
        id: req.optAppId ? req.optAppId : req.appId
      })
      // TODO: Make sure permissions line up
      return { app: appSearch }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readTrade, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.readRecipe, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(
    ElizaService,
    ElizaService.methods.updateIdentityMetadata,
    async req => {
      return await execute(req, async (req, app) => {})
    }
  )

  router.rpc(ElizaService, ElizaService.methods.updateInstance, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.updateItem, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.updateApp, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.updateTrade, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.updateRecipe, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.deleteInstance, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.closeTrade, async req => {
    return await execute(req, async (req, app) => {})
  })
}
