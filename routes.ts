import { ConnectRouter } from '@connectrpc/connect'
import { ElizaService } from './gen/eliza_connect'
import { log } from './lib/logger'
import { mappedPermissionValues } from './lib/permissions'
import { App, Item, PermissionLevels, PrismaClient } from '@prisma/client'
import { WebClient } from '@slack/web-api'
import config from './config'
import { v4 as uuid } from 'uuid'
import { getKeyByValue } from './lib/utils'

const web = new WebClient(config.SLACK_BOT_TOKEN)
const prisma = new PrismaClient()

const stringify = (obj: object) => {
  // Convert nulls to undefined so it passes through gRPC
  let newObj = {}
  for (let [key, value] of Object.entries(obj)) {
    if (key === 'metadata') {
      newObj[key] = JSON.stringify(value)
      continue
    }
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
    if (mappedPermissionValues[app.permissions] < permission)
      throw new Error(
        'Invalid permissions. Request permissions in Slack with /edit-app.'
      )
    const result = await func(req, app)
    return result
  } catch (error) {
    return { response: error.toString() }
  }
}

export default (router: ConnectRouter) => {
  // * WORKS
  router.rpc(ElizaService, ElizaService.methods.verifyKey, async req => {
    const app = await prisma.app.findUnique({
      where: { id: req.appId, AND: [{ key: req.key }] }
    })
    if (!app) return { valid: false }
    return { valid: true }
  })

  // * WORKS
  router.rpc(ElizaService, ElizaService.methods.createApp, async req => {
    return await execute(
      req,
      async (req, app) => {
        let key = uuid()
        while (await prisma.app.findUnique({ where: { key } })) key = uuid()

        const created = await prisma.app.create({
          data: {
            name: req.name,
            key,
            description: req.description,
            permissions:
              PermissionLevels[
                getKeyByValue(mappedPermissionValues, req.permissions)
              ],
            public: req.public,
            metadata: req.metadata ? JSON.parse(req.metadata) : {}
          }
        })
        return {
          app: {
            ...created,
            metadata: JSON.stringify(created.metadata)
          }
        }
      },
      mappedPermissionValues.ADMIN
    )
  })

  // * WORKS
  router.rpc(ElizaService, ElizaService.methods.createInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificTrades.find(trade => trade == req.itemId)
        )
          throw new Error('Not enough permissions to create instance')

        const item = await prisma.item.findUnique({
          where: {
            name: req.itemId
          }
        })
        if (!item) throw new Error('Item not found')

        // Create instance
        let identity = await prisma.identity.findUnique({
          where: {
            slack: req.identityId
          },
          include: {
            inventory: true
          }
        })
        if (!identity) throw new Error('Identity not found')

        const instance = await prisma.instance.create({
          data: {
            itemId: item.name,
            identityId: req.identityId,
            quantity: req.quantity || 1,
            metadata: req.metadata ? JSON.parse(req.metadata) : {}
          }
        })

        // Send message to instance receiver
        await web.chat.postMessage({
          channel: req.identityId,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${app.name}* just sent you ${item.reaction}: *${
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

  // * WORKS
  router.rpc(ElizaService, ElizaService.methods.createItem, async req => {
    return await execute(
      req,
      async req => {
        const item = await prisma.item.create({
          data: req.item
        })
        log('New item created: ', item.name)
        return { item }
      },
      mappedPermissionValues.ADMIN
    )
  })

  // * WORKS
  router.rpc(ElizaService, ElizaService.methods.createRecipe, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (!req.recipe.inputs.length || !req.recipe.outputs.length)
          throw new Error('Recipe should have inputs and outputs')
        const inputs = req.recipe.inputs.map(input => ({
          name: input
        }))
        const outputs = req.recipe.outputs.map(output => ({
          name: output
        }))
        const recipe = await prisma.recipe.create({
          data: { inputs: { connect: inputs }, outputs: { connect: outputs } }
        })
        if (app.permissions === PermissionLevels.WRITE_SPECIFIC)
          await prisma.app.update({
            where: {
              id: app.id
            },
            data: {
              specificRecipes: {
                push: recipe.id
              }
            }
          })
        return { recipe }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  // TODO
  router.rpc(ElizaService, ElizaService.methods.createTrade, async req => {
    return await execute(
      req,
      async req => {
        return {
          trade: await prisma.trade.create({
            data: {
              initiatorIdentityId: req.initator,
              receiverIdentityId: req.receiver,
              public: req.public
            }
          })
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  // TODO
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

      if (app.permissions === PermissionLevels.WRITE_SPECIFIC)
        user.inventory = user.inventory.filter(
          instance =>
            app.specificItems.includes(instance.itemId) || instance.public
        )
      if (mappedPermissionValues[app.permissions] < mappedPermissionValues.READ)
        user.inventory = user.inventory.filter(instance => instance.public)

      return { identity: stringify(user) }
    })
  })

  // TODO
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

      if (app.permissions === PermissionLevels.WRITE_SPECIFIC)
        user.inventory = user.inventory.filter(
          instance =>
            app.specificItems.includes(instance.itemId) || instance.public
        )
      if (app.permissions === PermissionLevels.READ)
        user.inventory = user.inventory.filter(instance => instance.public)

      return { inventory: user.inventory }
    })
  })

  // * WORKS
  router.rpc(ElizaService, ElizaService.methods.readItem, async req => {
    return await execute(req, async (req, app) => {
      const query = JSON.parse(req.query)
      let items = await prisma.item.findMany({
        where: query
      })

      if (app.permissions === PermissionLevels.WRITE_SPECIFIC)
        items = items.filter(
          item => app.specificItems.includes(item.name) || item.public
        )
      if (app.permissions === PermissionLevels.READ)
        items = items.filter(item => item.public)

      return { items: items.map(item => stringify(item)) }
    })
  })

  // TODO
  router.rpc(ElizaService, ElizaService.methods.readInstance, async req => {
    return await execute(req, async (req, app) => {
      const instance = await prisma.instance.findUnique({
        where: {
          id: req.instanceId
        }
      })

      if (!instance.public && app.permissions === PermissionLevels.READ)
        throw new Error('Instance not found')
      else if (!instance.public) return { instance }
    })
  })

  // * WORKS
  router.rpc(ElizaService, ElizaService.methods.readApp, async req => {
    return await execute(req, async (req, app) => {
      const appSearch = await prisma.app.findUnique({
        where: {
          id: req.optAppId ? req.optAppId : req.appId
        }
      })
      if (!appSearch) throw new Error('App not found')

      if (
        req.optAppId &&
        app.permissions !== PermissionLevels.ADMIN &&
        !app.specificApps.find(app => app === appSearch.id)
      )
        throw new Error('App not found')

      return { app: stringify(appSearch) }
    })
  })

  // TODO
  router.rpc(ElizaService, ElizaService.methods.readTrade, async req => {
    return await execute(req, async (req, app) => {
      const trade = await prisma.trade.findUnique({
        where: {
          id: req.tradeId
        }
      })

      // Make sure app can read trade, and filter out private items if needed
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readRecipe, async req => {
    return await execute(req, async (req, app) => {
      const recipe = await prisma.recipe.findUnique({
        where: {
          id: req.recipeId
        },
        include: {
          inputs: true,
          outputs: true
        }
      })

      if (app.permissions === PermissionLevels.READ && !recipe.public)
        throw new Error('Recipe not found')
      if (
        mappedPermissionValues[app.permissions] <
          mappedPermissionValues.WRITE &&
        !req.public &&
        !app.specificRecipes.find(recipeId => recipeId === recipe.id)
      )
        throw new Error('Recipe not found')

      return { recipe }
    })
  })

  // TODO
  router.rpc(
    ElizaService,
    ElizaService.methods.updateIdentityMetadata,
    async req => {
      return await execute(
        req,
        async (req, app) => {
          const identity = await prisma.identity.findUnique({
            where: {
              slack: req.identityId
            },
            include: {
              inventory: true
            }
          })
          if (!identity) throw new Error('Identity not found')

          const updated = await prisma.identity.update({
            where: {
              slack: req.identityId
            },
            data: {
              metadata: JSON.parse(req.metadata)
            }
          })

          return { app: stringify(updated) }
        },
        mappedPermissionValues.WRITE_SPECIFIC
      )
    }
  )

  // TODO
  router.rpc(ElizaService, ElizaService.methods.updateInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificItems.find(item => item === req.itemId)
        )
          throw new Error('Invalid permissions')

        // Delete invalid properties
        if (req.new.id !== undefined) delete req.new.id
        if (req.new.item !== undefined) delete req.new.item
        const instance = await prisma.instance.update({
          where: {
            id: req.instanceId
          },
          data: req.new
        })
        return { instance }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  // * WORKS
  router.rpc(ElizaService, ElizaService.methods.updateItem, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificItems.find(item => item === req.itemId)
        )
          throw new Error('Invalid permissions')

        for (let key of Object.keys(req.new))
          if (req.new[key] === '') delete req.new[key]
        const item = await prisma.item.update({
          where: {
            name: req.itemId
          },
          data: req.new
        })
        return { item: stringify(item) }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  // TODO: Figure out this gRPC thing. We can't tell if changing description is intentional
  router.rpc(ElizaService, ElizaService.methods.updateApp, async req => {
    return await execute(req, async (req, app) => {
      if (app.permissions !== PermissionLevels.ADMIN && req.optAppId)
        throw new Error('Invalid permissions')
      const old = await prisma.app.findUnique({
        where: {
          id: req.optAppId ? req.optAppId : req.appId
        }
      })

      delete req.new.id
      if (req.new.name === '') delete req.new.name
      if (req.new.permissions === '') delete req.new.permissions
      if (
        mappedPermissionValues[app.permissions] <
          mappedPermissionValues.WRITE_SPECIFIC &&
        req.optAppId
      )
        throw new Error('Invalid permissions')

      const updated = await prisma.app.update({
        where: {
          id: req.optAppId ? req.optAppId : req.appId
        },
        data: Object.assign(old, req.new)
      })
      return { app: updated }
    })
  })

  // TODO
  router.rpc(ElizaService, ElizaService.methods.updateTrade, async req => {
    return await execute(req, async (req, app) => {})
  })

  // TODO
  router.rpc(ElizaService, ElizaService.methods.updateRecipe, async req => {
    return await execute(
      req,
      async (req, app) => {
        const recipe = await prisma.recipe.findUnique({
          where: {
            id: req.recipe
          }
        })
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  // TODO
  router.rpc(ElizaService, ElizaService.methods.deleteInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        const instance = await prisma.instance.findUnique({
          where: {
            id: req.instanceId
          }
        })
        if (!instance) throw new Error('Instance not found')

        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificItems.find(item => item === instance.itemId)
        )
          throw new Error('Invalid permissions')

        const deleted = await prisma.instance.delete({
          where: {
            id: req.instanceId
          }
        })
        return { deletedInstance: deleted }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  // TODO
  router.rpc(ElizaService, ElizaService.methods.closeTrade, async req => {
    return await execute(
      req,
      async (req, app) => {
        const trade = await prisma.trade.findUnique({
          where: {
            id: req.tradeId
          }
        })
        if (!trade) throw new Error('Trade not found')

        // * Apps can close trades without both sides agreeing. This is so trades can be used to simulate other behavior, but also because it makes it more fun.
        await prisma.trade.update({
          where: {
            id: req.tradeId
          },
          data: {
            closed: true
          }
        })

        // Transfer items between users
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })
}
