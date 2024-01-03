import { ConnectRouter } from '@connectrpc/connect'
import { ElizaService } from './gen/eliza_connect'
import slack from './lib/slack/routes'
import { log, err } from './lib/logger'
import { Apps, Identities, Instances, Items } from './lib/db'
import { mappedPermissionValues } from './lib/permissions'
import { PermissionLevels } from '@prisma/client'
import { Item } from '@prisma/client'
import { WebClient } from '@slack/web-api'
import config from './config'

const web = new WebClient(config.SLACK_BOT_TOKEN)

const stringify = (obj: object) => {
  // Convert nulls to undefined so it passes through gRPC
  let newObj = {}
  for (let [key, value] of Object.entries(obj)) {
    newObj[key] = value !== null ? value : undefined
  }
  return newObj
}

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
    return await execute(
      req,
      async (req, app) => {
        const item = await Items.find({ name: req.itemId })
        if (!item) throw new Error('Item not found')

        // Make sure app has permissions to assign specific item
        if (
          mappedPermissionValues[app.permissions] ==
          mappedPermissionValues.WRITE_SPECIFIC
        ) {
          console.log(app.specific)
          return { response: 'still tryna figure it out man' }
        }

        // Create instance
        let identity = await Identities.find(req.identityId)
        if (!identity) throw new Error('Identity not found; create it first!')
        const instance = await identity.giveInstance(item.name)

        // Send message to instance receiver!
        await web.chat.postMessage({
          channel: req.identityId,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${app.name}* just sent you *${
                  item.name
                }*! It's in your inventory now.${
                  req.note && " There's a note attached to it: " + req.note
                }`
              }
            }
          ]
        })

        return { instance }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(ElizaService, ElizaService.methods.createItem, async req => {
    return await execute(req, async (req, app) => {
      if (app.permissions !== PermissionLevels.ADMIN)
        throw new Error('Invalid permissions')
      const item = await Items.create(req.item as Item)
      return { item }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.createRecipe, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.createTrade, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.readIdentity, async req => {
    return await execute(req, async (req, app) => {
      const user = await Identities.find(req.identityId)
      if (!user) throw new Error('Identity not found')

      // TODO: Make sure to filter out private items!

      return { identity: user }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readInventory, async req => {
    return await execute(req, async (req, app) => {
      const user = await Identities.find(req.identityId)
      if (!user) throw new Error('Identity not found')

      // TODO: Make sure to filter out private items!

      return { inventory: user.inventory }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readItem, async req => {
    return await execute(req, async (req, app) => {
      const query = JSON.parse(req.query)
      const item = await Items.find(query)
      if (item && (item.public || app.permissions === PermissionLevels.ADMIN))
        return { item: stringify(item) } // TODO: Take care of specific permissions
      throw new Error(`Query ${req.query} didn't return any results`)
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readInstance, async req => {
    return await execute(req, async (req, app) => {
      const instance = await Instances.find(req.instanceId)
      if (
        !instance.public &&
        mappedPermissionValues[app.permissions] <
          mappedPermissionValues.READ_PRIVATE
      )
        throw new Error('Instance not found') // TODO: Deal with permissions
      return { instance }
    })
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
    return await execute(
      req,
      async (req, app) => {
        const item = await Items.find({ name: req.itemId })
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(ElizaService, ElizaService.methods.updateApp, async req => {
    return await execute(req, async (req, app) => {
      if (app.permissions !== PermissionLevels.ADMIN && req.optAppId)
        throw new Error('Invalid permissions')
      const old = await Apps.find({
        id: req.optAppId ? req.optAppId : req.appId
      })
      await old.update(req.new)
      return { app: old }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.updateTrade, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.updateRecipe, async req => {
    return await execute(req, async (req, app) => {})
  })

  router.rpc(ElizaService, ElizaService.methods.deleteInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        // TODO: Make sure permissions are locked
        const instance = await Instances.deleteInstance(req.instanceId)
        return { deletedInstance: instance }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(ElizaService, ElizaService.methods.closeTrade, async req => {
    return await execute(req, async (req, app) => {})
  })
}
