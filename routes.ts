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

const format = obj => {
  if (obj.metadata) obj.metadata = JSON.stringify(obj.metadata)
  for (let [key, value] of Object.entries(obj)) {
    if (value instanceof Object) obj[key] = format(value)
    else if (value === null) obj[key] = undefined
  }
  return obj
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
    // Strip appId and key
    delete req.appId
    delete req.key
    const result = await func(req, app)
    return result
  } catch (error) {
    return { response: error.toString() }
  }
}

export default (router: ConnectRouter) => {
  router.rpc(ElizaService, ElizaService.methods.verifyKey, async (_, app) => {
    if (!app) return { valid: false }
    return { valid: true }
  })

  router.rpc(ElizaService, ElizaService.methods.createApp, async req => {
    return await execute(
      req,
      async req => {
        if (!req.name) throw new Error('Name of app not provided')
        const created = await prisma.app.create({
          data: {
            ...req,
            permissions: req.permissions
              ? getKeyByValue(mappedPermissionValues, req.permissions)
              : PermissionLevels.READ,
            key: uuid()
          }
        })
        return { app: format(created) }
      },
      mappedPermissionValues.ADMIN
    )
  })

  router.rpc(ElizaService, ElizaService.methods.createInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificItems.find(item => item === req.itemId)
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

        let instance
        const existing = identity.inventory.find(
          instance => instance.itemId === item.name
        )
        if (existing !== undefined)
          instance = await prisma.instance.update({
            where: {
              id: existing.id
            },
            data: {
              quantity: existing.quantity + Math.max(req.quantity, 1),
              metadata: req.metadata
                ? {
                    ...(existing.metadata as object),
                    ...JSON.parse(req.metadata)
                  }
                : existing.metadata
            },
            include: {
              item: true
            }
          })
        else
          instance = await prisma.instance.create({
            data: {
              itemId: item.name,
              identityId: req.identityId,
              quantity: req.quantity || 1,
              metadata: req.metadata ? JSON.parse(req.metadata) : {}
            },
            include: {
              item: true
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
                text: `*${app.name}* just sent you x${req.quantity || 1} ${
                  item.reaction
                }: *${item.name}*! It's in your inventory now.${
                  req.note
                    ? " There's a note attached to it: \n\n>" + req.note
                    : ''
                }`
              }
            }
          ]
        })

        console.log('Formatted', format(instance))
        return { instance: format(instance) }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(ElizaService, ElizaService.methods.createItem, async req => {
    return await execute(
      req,
      async req => {
        if (!req.item.name || !req.item.reaction)
          throw new Error('Required fields for new items: name, reaction')
        const item = await prisma.item.create({
          data: req.item
        })
        log('New item created: ', item.name)
        return { item: format(item) }
      },
      mappedPermissionValues.ADMIN
    )
  })

  router.rpc(ElizaService, ElizaService.methods.createRecipe, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (!req.inputs.length || !req.outputs.length)
          throw new Error('Recipe should have inputs and outputs')
        if (app.permissions === PermissionLevels.WRITE_SPECIFIC) {
          if (
            req.inputs
              .map(input => app.specificItems.includes(input))
              .includes(false)
          )
            throw new Error('Invalid inputs')
          if (
            req.outputs
              .map(output => app.specificItems.includes(output))
              .includes(false)
          )
            throw new Error('Invalid outputs')
        }

        const inputs = req.inputs.map(input => ({ name: input }))
        const outputs = req.outputs.map(output => ({ name: output }))
        let recipe
        try {
          recipe = await prisma.recipe.create({
            data: {
              inputs: { connect: inputs },
              outputs: { connect: outputs }
            },
            include: { inputs: true, outputs: true }
          })
        } catch {
          throw new Error('Invalid inputs and/or outputs')
        }
        if (app.permissions === PermissionLevels.WRITE_SPECIFIC)
          await prisma.app.update({
            where: { id: app.id },
            data: {
              specificRecipes: {
                push: recipe.id
              }
            }
          })
        return {
          recipe: {
            ...format(recipe),
            inputIds: req.inputs,
            outputIds: req.outputs
          }
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  // TODO: Make sure to add to specific trades
  router.rpc(ElizaService, ElizaService.methods.createTrade, async req => {
    return await execute(req, async req => {})
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

      if (
        mappedPermissionValues[app.permissions] < mappedPermissionValues.WRITE
      )
        user.inventory = user.inventory.filter(
          instance =>
            app.specificItems.includes(instance.itemId) || instance.public
        )
      if (app.permissions === PermissionLevels.READ)
        user.inventory = user.inventory.filter(instance => instance.public)

      return { identity: format(user) }
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

      if (
        mappedPermissionValues[app.permissions] <
        mappedPermissionValues.WRITE_SPECIFIC
      )
        user.inventory = user.inventory.filter(
          instance =>
            app.specificItems.includes(instance.itemId) || instance.public
        )
      if (app.permissions === PermissionLevels.READ)
        user.inventory = user.inventory.filter(instance => instance.public)

      return { inventory: format(user.inventory) }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readItem, async req => {
    return await execute(req, async (req, app) => {
      const query = JSON.parse(req.query)
      let items = await prisma.item.findMany({
        where: query
      })

      if (
        mappedPermissionValues[app.permissions] <
        mappedPermissionValues.WRITE_SPECIFIC
      )
        items = items.filter(
          item => app.specificItems.includes(item.name) || item.public
        )
      if (app.permissions === PermissionLevels.READ)
        items = items.filter(item => item.public)

      return { items: format(items) }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readInstance, async req => {
    return await execute(req, async (req, app) => {
      try {
        const instance = await prisma.instance.findUnique({
          where: {
            id: req.instanceId
          }
        })

        if (!instance.public && app.permissions === PermissionLevels.READ)
          throw new Error()
        else if (
          mappedPermissionValues[app.permissions] <
            mappedPermissionValues.WRITE &&
          !app.specificItems.find(itemId => itemId === instance.itemId)
        )
          throw new Error()

        return { instance: format(instance) }
      } catch {
        throw new Error('Instance not found')
      }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readApp, async req => {
    return await execute(req, async (req, app) => {
      try {
        const appSearch = await prisma.app.findUnique({
          where: {
            id: req.optAppId ? req.optAppId : req.appId
          }
        })
        if (!appSearch) throw new Error()
        if (req.optAppId) {
          if (!appSearch.public && app.permissions === PermissionLevels.READ)
            throw new Error()
          else if (
            !appSearch.public &&
            mappedPermissionValues[app.permissions] <
              mappedPermissionValues.WRITE &&
            !app.specificApps.find(appId => appSearch.id === appId)
          )
            throw new Error()
        }

        return { app: format(appSearch) }
      } catch {
        throw new Error('App not found')
      }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readTrade, async req => {
    return await execute(req, async (req, app) => {
      try {
        const trade = await prisma.trade.findUnique({
          where: {
            id: req.tradeId
          },
          include: {
            initiatorTrades: true,
            receiverTrades: true
          }
        })
        if (!trade) throw new Error()
        if (!trade.public && app.permissions === PermissionLevels.READ)
          throw new Error()
        if (
          !trade.public &&
          mappedPermissionValues[app.permissions] <
            mappedPermissionValues.WRITE &&
          !app.specificTrades.find(tradeId => tradeId === trade.id)
        )
          throw new Error()

        return { trade: format(trade) }
      } catch {
        throw new Error('Trade not found')
      }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.readRecipe, async req => {
    return await execute(req, async (req, app) => {
      try {
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
          throw new Error()
        if (
          mappedPermissionValues[app.permissions] <
            mappedPermissionValues.WRITE &&
          !req.public &&
          !app.specificRecipes.find(recipeId => recipeId === recipe.id)
        )
          throw new Error()

        return {
          recipe: {
            ...format(recipe),
            inputIds: recipe.inputs.map(input => input.name),
            outputIds: recipe.outputs.map(output => output.name)
          }
        }
      } catch {
        throw new Error('Recipe not found')
      }
    })
  })

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

          return { identity: format(updated) }
        },
        mappedPermissionValues.WRITE_SPECIFIC
      )
    }
  )

  router.rpc(ElizaService, ElizaService.methods.updateInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificApps.find(item => item === req.itemId)
        )
          throw new Error('Invalid permissions')

        if (req.new.id !== undefined) delete req.new.id
        let instance = await prisma.instance.update({
          where: {
            id: req.instanceId
          },
          data: req.new
        })

        if (instance.quantity === 0) {
          // Delete instance
          instance = await prisma.instance.delete({
            where: {
              id: req.instanceId
            }
          })
          // TODO: Let user know their instance disappeared
        }

        // TODO: Let user know their instances were updated
        return { instance: format(instance) }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(ElizaService, ElizaService.methods.updateItem, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificItems.find(item => item === req.itemId)
        )
          throw new Error('Invalid permissions')

        const item = await prisma.item.update({
          where: {
            name: req.itemId
          },
          data: req.new
        })
        return { item: format(item) }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(ElizaService, ElizaService.methods.updateApp, async req => {
    return await execute(req, async (req, app) => {
      if (
        req.optAppId &&
        mappedPermissionValues[app.permissions] <
          mappedPermissionValues.WRITE_SPECIFIC
      )
        throw new Error('Invalid permissions')
      if (
        req.optAppId &&
        app.permissions === PermissionLevels.WRITE_SPECIFIC &&
        !app.specificApps.find(appId => appId === req.optAppId)
      )
        throw new Error('Invalid permissions')
      const old = await prisma.app.findUnique({
        where: {
          id: req.optAppId ? req.optAppId : req.appId
        }
      })

      if (req.new.id !== undefined) delete req.new.id
      if (req.new.name === '') throw new Error('Name of app cannot be blank')

      const updated = await prisma.app.update({
        where: {
          id: req.optAppId ? req.optAppId : req.appId
        },
        data: Object.assign(old, req.new)
      })
      return { app: format(updated) }
    })
  })

  router.rpc(ElizaService, ElizaService.methods.updateTrade, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificTrades.find(tradeId => tradeId === req.tradeId)
        )
          throw new Error('Invalid permissions')

        const trade = await prisma.trade.findUnique({
          where: {
            id: req.tradeId
          }
        })
        if (!trade) throw new Error('Trade not found')
        if (
          ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
            req.identityId
          )
        )
          throw new Error('Identity not allowed to edit trade')

        const updateKey = trade.initiatorIdentityId
        await prisma.trade.update({
          where: {
            id: req.tradeId
          },
          data: {}
        })
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  //TODO
  router.rpc(ElizaService, ElizaService.methods.updateRecipe, async req => {
    return await execute(req, async (req, app) => {})
  })

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
        return { deletedInstance: format(deleted) }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })
}
