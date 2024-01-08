import { ConnectRouter } from '@connectrpc/connect'
import { ElizaService } from './gen/eliza_connect'
import { log, err } from './lib/logger'
import { mappedPermissionValues } from './lib/permissions'
import { App, PermissionLevels, PrismaClient } from '@prisma/client'
import { WebClient } from '@slack/web-api'
import config from './config'
import { v4 as uuid } from 'uuid'

const web = new WebClient(config.SLACK_BOT_TOKEN)
const prisma = new PrismaClient()

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
  func: (req: any, app: App) => any,
  permission?: number
) {
  try {
    let app = await prisma.app.findUnique({
      where: { id: req.appId, AND: [{ key: req.key }] }
    })
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
  router.rpc(ElizaService, ElizaService.methods.verifyKey, async req => {
    const app = await prisma.app.findUnique({
      where: { id: req.appId, AND: [{ key: req.key }] }
    })
    if (!app) return { valid: false }
    return { value: true }
  })

  router.rpc(ElizaService, ElizaService.methods.createApp, async req => {
    return await execute(req, async (req, app) => {
      if (app.permissions !== PermissionLevels.ADMIN)
        throw new Error('Invalid permissions')

      let key = uuid()
      while (await prisma.app.findUnique({ where: { key } })) key = uuid()

      const created = await prisma.app.create({
        data: {
          name: req.name,
          key,
          description: req.description,
          permissions: req.permissions,
          public: req.public,
          metadata: req.metadata ? JSON.parse(req.metadata) : {}
        }
      })
      return { app: created }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.createInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        const item = await prisma.item.findUnique({
          where: {
            name: req.itemId
          }
        })
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
        let identity = await prisma.identity.findUnique({
          where: {
            slack: req.identityId
          },
          include: {
            inventory: true
          }
        })
        if (!identity) throw new Error('Identity not found; create it first!')
        const instance = await prisma.instance.create({
          data: {
            itemId: item.name,
            identityId: req.identityId,
            quantity: req.quantity || 1,
            metadata: req.metadata ? JSON.parse(req.metadata) : {}
          }
        })

        // Send message to instance receiver!
        await web.chat.postMessage({
          channel: req.identityId,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${app.name}* just sent you ${item.reaction}:: *${
                  item.name
                }*! It's in your inventory now.${
                  req.note && " There's a note attached to it: \n\n>" + req.note
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
      const item = await prisma.item.create({
        data: req.item
      })
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
      const user = await prisma.identity.findUnique({
        where: {
          slack: req.identityId
        },
        include: {
          inventory: true
        }
      })
      if (!user) throw new Error('Identity not found')

      // TODO: Make sure to filter out private items!

      return { identity: stringify(user) }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readInventory, async req => {
    return await execute(req, async (req, app) => {
      const user = await prisma.identity.findUnique({
        where: {
          slack: req.identityId
        },
        include: {
          inventory: true
        }
      })
      if (!user) throw new Error('Identity not found')

      // TODO: Make sure to filter out private items!

      return { inventory: user.inventory }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readItem, async req => {
    return await execute(req, async (req, app) => {
      const query = JSON.parse(req.query)
      const item = await prisma.item.findUnique({
        where: query
      })
      if (item && (item.public || app.permissions === PermissionLevels.ADMIN))
        return { item: stringify(item) } // TODO: Take care of specific permissions
      throw new Error(`Query ${req.query} didn't return any results`)
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readInstance, async req => {
    return await execute(req, async (req, app) => {
      const instance = await prisma.instance.findUnique({
        where: {
          id: req.instanceId
        }
      })
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
      const appSearch = await prisma.app.findUnique({
        where: {
          id: req.optAppId ? req.optAppId : req.appId
        }
      })
      if (!appSearch) throw new Error('App not found')
      // TODO: Make sure permissions line up
      return { app: stringify(appSearch) }
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
        const item = await prisma.item.update({
          where: {
            name: req.itemId
          },
          data: req.new
        })
        return { item }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(ElizaService, ElizaService.methods.updateApp, async req => {
    return await execute(req, async (req, app) => {
      if (app.permissions !== PermissionLevels.ADMIN && req.optAppId)
        throw new Error('Invalid permissions')
      const old = await prisma.app.findUnique({
        where: {
          id: req.optAppId ? req.optAppId : req.appId
        }
      })
      // TODO: Make sure it's not possible to do illegal things here
      delete req.new.id
      if (req.new.permissions === '') delete req.new.permissions
      const updated = await prisma.app.update({
        where: {
          id: req.optAppId ? req.optAppId : req.appId
        },
        data: Object.assign(old, req.new)
      })
      return { app: updated }
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
        const instance = await prisma.instance.delete({
          where: {
            id: req.instanceId
          }
        })
        return { deletedInstance: instance }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(ElizaService, ElizaService.methods.closeTrade, async req => {
    return await execute(req, async (req, app) => {})
  })
}
