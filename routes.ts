import config from './config'
import { BagService } from './gen/bag_connect'
import { InstanceWithItem, TradeWithTrades } from './lib/db'
import { prisma } from './lib/db'
import { log } from './lib/logger'
import { mappedPermissionValues } from './lib/permissions'
import { getKeyByValue } from './lib/utils'
import { ConnectRouter } from '@connectrpc/connect'
import {
  App,
  Item,
  PermissionLevels,
  Recipe,
  RecipeItem,
  Skill
} from '@prisma/client'
import type { Block, KnownBlock } from '@slack/bolt'
import { WebClient } from '@slack/web-api'
import util from 'util'
import { v4 as uuid } from 'uuid'

const web = new WebClient(config.SLACK_BOT_TOKEN)

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
    let formatted = {}
    for (let [key, value] of Object.entries(result)) {
      formatted[key] = format(value)
    }
    return formatted
  } catch (error) {
    return { response: error.toString() }
  }
}

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.verifyKey, async req => {
    return await execute(req, async (req, app) => {
      if (!app) return { valid: false }
      return { valid: true }
    })
  })

  router.rpc(BagService, BagService.methods.createApp, async req => {
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
        return { app: created }
      },
      mappedPermissionValues.ADMIN
    )
  })

  router.rpc(BagService, BagService.methods.createInstances, async req => {
    return await execute(
      req,
      async (req, app) => {
        let created = []
        let formatted = []

        let identity = await prisma.identity.findUnique({
          where: {
            slack: req.identityId
          },
          include: {
            inventory: true
          }
        })
        if (!identity)
          identity = await prisma.identity.create({
            data: {
              slack: req.identityId
            },
            include: {
              inventory: true
            }
          })

        for (let instance of req.instances) {
          const item = await prisma.item.findUnique({
            where: {
              name: instance.itemId
            }
          })
          if (!item) throw new Error('Item not found')
          if (
            app.permissions === PermissionLevels.WRITE_SPECIFIC &&
            !app.specificItems.find(item => item === req.itemId)
          )
            throw new Error('Not enough permissions to create instance')

          // Create instance
          let create
          const existing = identity.inventory.find(
            instance => instance.itemId === item.name
          )
          if (existing !== undefined) {
            create = await prisma.instance.update({
              where: {
                id: existing.id
              },
              data: {
                quantity:
                  existing.quantity + Math.max(instance.quantity || 0, 1),
                metadata: instance.metadata
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
          } else
            create = await prisma.instance.create({
              data: {
                itemId: item.name,
                identityId: req.identityId,
                quantity: instance.quantity || 1,
                metadata: instance.metadata ? JSON.parse(instance.metadata) : {}
              },
              include: {
                item: true
              }
            })
          created.push(create)
          formatted.push(
            `x${instance.quantity || 1} ${item.reaction} *${item.name}*`
          )
        }

        // Send message to instance receiver
        let text = []
        if (req.show !== false)
          text.push(
            `*${app.name}* just sent you ${
              formatted.slice(0, formatted.length - 1).join(', ') +
              (formatted.length > 2 ? ',' : '') +
              ' and ' +
              formatted[formatted.length - 1]
            }! They're all in your bag now.`
          )
        if (req.note) {
          if (req.note.includes('\n')) text.push(`\n\n${req.note}`)
          else text.push(`\n\n\n>${req.note}`)
        }
        await web.chat.postMessage({
          channel: req.identityId,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: text.join('')
              }
            }
          ]
        })

        return { instances: created }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.createInstance, async req => {
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
        if (!identity)
          await prisma.identity.create({
            data: {
              slack: req.identityId
            }
          })

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
              quantity: existing.quantity + Math.max(req.quantity || 0, 1),
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
        let text: (Block | KnownBlock)[] = []
        if (req.show !== false)
          text.push({
            type: 'section',
            text: {
              text: `*${app.name}* just sent you x${req.quantity || 1} ${
                item.reaction
              } *${item.name}*! It's in your bag now.`,
              type: 'mrkdwn'
            }
          })
        if (req.note) {
          if (req.note.includes('\n'))
            text.push(
              {
                type: 'divider'
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `${req.note}`
                }
              },
              {
                type: 'divider'
              }
            )
          else
            text.push(
              { type: 'divider' },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `${req.note}`
                }
              },
              {
                type: 'divider'
              }
            )
        }
        await web.chat.postMessage({
          channel: req.identityId,
          blocks: text
        })

        return { instance: instance }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.createItem, async req => {
    return await execute(
      req,
      async req => {
        if (!req.item.name || !req.item.reaction)
          throw new Error('Required fields for new items: name, reaction')
        const item = await prisma.item.create({
          data: req.item
        })
        log('New item created: ', item.name)
        return { item }
      },
      mappedPermissionValues.ADMIN
    )
  })

  router.rpc(BagService, BagService.methods.createRecipe, async req => {
    return await execute(
      req,
      async (req, app) => {
        let inputs: RecipeItem[] = []
        let outputs: RecipeItem[] = []
        let tools: RecipeItem[] = []
        let skills: Skill[] = []

        const sum = (inputs: RecipeItem[], tools: RecipeItem[]): number => {
          const inputTotal = inputs.reduce(
            (curr: number, acc) => curr + acc.quantity,
            0
          )
          const toolTotal = tools.reduce(
            (curr: number, acc) => curr + acc.quantity,
            0
          )
          return inputTotal + toolTotal
        }

        const { recipe } = req
        if (sum(recipe.inputs, recipe.tools) < 2 || !recipe.outputs.length)
          throw new Error(
            'Recipe requires at least two inputs and/or at least one output'
          )

        for (let input of recipe.inputs) {
          // Check if there's an existing RecipeItem, and use that if possible with upsert
          let create = await prisma.recipeItem.findFirst({ where: input })
          if (!create) create = await prisma.recipeItem.create({ data: input })
          inputs.push(create)
        }
        delete recipe.inputs
        for (let output of recipe.outputs) {
          let create = await prisma.recipeItem.findFirst({ where: output })
          if (!create) create = await prisma.recipeItem.create({ data: output })
          outputs.push(create)
        }
        delete recipe.outputs
        for (let tool of recipe.tools) {
          let create = await prisma.recipeItem.findFirst({ where: tool })
          if (!create) create = await prisma.recipeItem.create({ data: tool })
          tools.push(create)
        }
        delete recipe.tools
        for (let skill of recipe.skills) {
          let create = await prisma.skill.findFirst({ where: skill })
          if (!skill) create = await prisma.skill.create({ data: create })
          skills.push(create)
        }
        delete recipe.skills

        // Create recipe
        const create = await prisma.recipe.create(
          recipe.description
            ? { data: { description: recipe.description } }
            : { data: { description: 'No description provided.' } }
        )
        // Add to permission list depending on app permissions
        if (app.permissions === PermissionLevels.WRITE_SPECIFIC)
          await prisma.app.update({
            where: { id: app.id },
            data: { specificRecipes: { push: create.id } }
          })

        // Connect inputs, outputs, tools, skills
        for (let input of inputs)
          await prisma.recipeItem.update({
            where: { id: input.id },
            data: { inputs: { connect: { id: create.id } } }
          })
        for (let output of outputs)
          await prisma.recipeItem.update({
            where: { id: output.id },
            data: { outputs: { connect: { id: create.id } } }
          })
        for (let tool of tools)
          await prisma.recipeItem.update({
            where: { id: tool.id },
            data: { tools: { connect: { id: create.id } } }
          })
        for (let skill of skills)
          await prisma.skill.update({
            where: { name: skill.name },
            data: { recipe: { connect: { id: create.id } } }
          })

        return {
          recipe: await prisma.recipe.findUnique({
            where: { id: create.id },
            include: {
              inputs: true,
              outputs: true,
              tools: true,
              skills: true
            }
          })
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

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
            where: {
              id: app.id
            },
            data: {
              specificTrades: { push: trade.id }
            }
          })

        return { trade: trade }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.createAction, async req => {
    return await execute(
      req,
      async req => {
        // ! TODO: Assumes that channel exists and that tools exist too, since testing branches takes up too much effort
        return {
          action: await prisma.action.create({
            data: {
              locations: req.action.locations,
              tools: req.action.tools.map(tool => tool.toLowerCase()),
              branch: JSON.parse(req.action.branch)
            }
          })
        }
      },
      mappedPermissionValues.ADMIN
    )
  })

  router.rpc(BagService, BagService.methods.readIdentity, async req => {
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

      return { identity: user }
    })
  })

  router.rpc(BagService, BagService.methods.readInventory, async req => {
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

      return { inventory: user.inventory }
    })
  })

  router.rpc(BagService, BagService.methods.readItem, async req => {
    return await execute(req, async (req, app) => {
      const query = JSON.parse(req.query)
      let item = await prisma.item.findFirst({
        where: {
          ...query,
          public: app.permissions === PermissionLevels.READ ? true : undefined
        }
      })

      if (
        mappedPermissionValues[app.permissions] <
          mappedPermissionValues.WRITE &&
        app.specificItems.includes(item.name)
      )
        return { item }

      return {}
    })
  })

  router.rpc(BagService, BagService.methods.readItems, async req => {
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

      return { items }
    })
  })

  router.rpc(BagService, BagService.methods.readInstance, async req => {
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
          return { instance }
      } catch {
        throw new Error('Instance not found')
      }
    })
  })

  router.rpc(BagService, BagService.methods.readApp, async req => {
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

        return { app: appSearch }
      } catch {
        throw new Error('App not found')
      }
    })
  })

  router.rpc(BagService, BagService.methods.readTrade, async req => {
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
        if (!trade.public && app.permissions === PermissionLevels.READ)
          throw new Error()
        if (
          !trade.public &&
          mappedPermissionValues[app.permissions] <
            mappedPermissionValues.WRITE &&
          !app.specificTrades.find(tradeId => tradeId === trade.id)
        )
          throw new Error()

        return { trade }
      } catch {
        throw new Error('Trade not found')
      }
    })
  })

  router.rpc(BagService, BagService.methods.readRecipe, async req => {
    return await execute(req, async (req, app) => {
      // Search for recipe
      let recipes = await prisma.recipe.findMany({
        include: {
          inputs: true,
          outputs: true,
          tools: true,
          skills: true
        }
      })

      // Search through recipes
      recipes = recipes.filter(recipe => {
        for (let input of req.query.inputs) {
          if (
            !recipe.inputs.find(
              item => item.recipeItemId === input.recipeItemId
            )
          )
            return false
        }
        for (let output of req.query.outputs) {
          if (
            !recipe.outputs.find(
              item => item.recipeItemId === output.recipeItemId
            )
          )
            return false
        }
        for (let tool of req.query.tools) {
          if (
            !recipe.tools.find(item => item.recipeItemId === tool.recipeItemId)
          )
            return false
        }
        for (let skill of req.query.skills) {
          if (
            !recipe.skills.find(recipeSkill => recipeSkill.name === skill.name)
          )
            return false
        }
        return true
      })

      if (app.permissions === PermissionLevels.READ)
        recipes = recipes.filter(recipe => recipe.public)
      else if (
        mappedPermissionValues[app.permissions] < mappedPermissionValues.WRITE
      )
        recipes = recipes.filter(recipe =>
          app.specificRecipes.find(id => recipe.id === id)
        )
      return { recipes }
    })
  })

  router.rpc(BagService, BagService.methods.readAction, async req => {
    return await execute(req, async (req, app) => {
      // TODO: Filter for permissions
      // Search for action
      let actions = await prisma.action.findMany({
        where: {
          locations: { hasSome: req.query.locations },
          tools: { hasSome: req.query.tools.map(tool => tool.toLowerCase()) },
          branch: req.query.branch
            ? { equals: JSON.parse(req.query.branch) }
            : undefined
        }
      })
      return { actions }
    })
  })

  router.rpc(
    BagService,
    BagService.methods.updateIdentityMetadata,
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

          return { identity: updated }
        },
        mappedPermissionValues.WRITE_SPECIFIC
      )
    }
  )

  router.rpc(BagService, BagService.methods.updateInstance, async req => {
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

        let text: (Block | KnownBlock)[] = []
        if (instance.quantity === 0) {
          // Delete instance
          instance = await prisma.instance.delete({
            where: {
              id: req.instanceId
            },
            include: {
              item: true
            }
          })

          if (req.show !== false)
            text.push({
              type: 'section',
              text: {
                text: `*${app.name}* just removed ${
                  (instance as InstanceWithItem).item.name
                } from your bag!`,
                type: 'mrkdwn'
              }
            })
        } else {
          if (req.show !== false)
            text.push({
              type: 'section',
              text: {
                text: `*${app.name}* just updated ${
                  (instance as InstanceWithItem).item.name
                } from your bag!`,
                type: 'mrkdwn'
              }
            })
        }
        if (req.note) {
          if (req.note.includes('\n'))
            text.push(
              {
                type: 'divider'
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `${req.note}`
                }
              },
              {
                type: 'divider'
              }
            )
          else
            text.push(
              { type: 'divider' },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `${req.note}`
                }
              },
              {
                type: 'divider'
              }
            )
        }
        await web.chat.postMessage({
          channel: req.identityId,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: text.join('')
              }
            }
          ]
        })

        return { instance }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.updateItem, async req => {
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
        return { item }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.updateApp, async req => {
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

      if (req.new.id !== undefined) delete req.new.identity
      if (req.new.name === '') throw new Error('Name of app cannot be blank')

      const updated = await prisma.app.update({
        where: {
          id: req.optAppId ? req.optAppId : req.appId
        },
        data: Object.assign(old, req.new)
      })
      return { app: updated }
    })
  })

  //       await prisma.trade.update({
  //         where: {
  //           id: req.tradeId
  //         },
  //         data: {
  //           [updateKey]: {
  //             push: { connect: req.add.map(instance => ({ id: instance.id })) }
  //           }
  //         }
  //       })
  router.rpc(BagService, BagService.methods.updateTrade, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificTrades.find(tradeId => tradeId === req.tradeId)
        )
          throw new Error('Invalid permissions')

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

  router.rpc(BagService, BagService.methods.updateRecipe, async req => {
    return await execute(
      req,
      async (req, app) => {
        // TODO: Make sure permissions are set

        let inputs: RecipeItem[] = []
        let outputs: RecipeItem[] = []
        let tools: RecipeItem[] = []
        let skills: Skill[] = []

        const sum = (inputs: RecipeItem[], tools: RecipeItem[]): number => {
          const inputTotal = inputs.reduce(
            (curr: number, acc) => curr + acc.quantity,
            0
          )
          const toolTotal = tools.reduce(
            (curr: number, acc) => curr + acc.quantity,
            0
          )
          return inputTotal + toolTotal
        }

        const { new: recipe } = req
        if (sum(recipe.inputs, recipe.tools) < 2 || !recipe.outputs.length)
          throw new Error(
            'Recipe requires at least two inputs and/or at least one output'
          )

        // Update recipe
        const update = await prisma.recipe.update({
          where: { id: req.recipeId },
          data: { description: recipe.description },
          include: {
            inputs: true,
            outputs: true,
            tools: true,
            skills: true
          }
        })

        for (let input of recipe.inputs) {
          // Check if there's a existing RecipeItem, and use that if possible
          if (
            !update.inputs.find(
              item => item.recipeItemId === input.recipeItemId
            )
          ) {
            let create = await prisma.recipeItem.findFirst({ where: input })
            if (create)
              await prisma.recipeItem.update({
                where: { id: create.id },
                data: { inputs: { connect: { id: update.id } } }
              })
            // If recipeItem with item already exists, connect to that
            else
              await prisma.recipeItem.create({
                data: {
                  ...input,
                  inputs: { connect: { id: update.id } }
                }
              })
          }
        }
        for (let output of recipe.outputs) {
          if (
            !update.outputs.find(
              item => item.recipeItemId === output.recipeItemId
            )
          ) {
            let create = await prisma.recipeItem.findFirst({ where: output })
            if (create)
              await prisma.recipeItem.update({
                where: { id: create.id },
                data: { outputs: { connect: { id: update.id } } }
              })
            else
              await prisma.recipeItem.create({
                data: {
                  ...output,
                  outputs: { connect: { id: update.id } }
                }
              })
          }
        }
        for (let tool of recipe.tools) {
          if (
            !update.tools.find(item => item.recipeItemId === tool.recipeItemId)
          ) {
            let create = await prisma.recipeItem.findFirst({ where: tool })
            if (create)
              await prisma.recipeItem.update({
                where: { id: create.id },
                data: { tools: { connect: { id: update.id } } }
              })
            else
              await prisma.recipeItem.create({
                data: {
                  ...tool,
                  tools: { connect: { id: update.id } }
                }
              })
          }
        }
        for (let skill of recipe.skills) {
          if (
            !update.skills.find(
              skillInstance => skillInstance.name === skill.name
            )
          ) {
            let create = await prisma.skill.findFirst({ where: skill })
            if (create)
              await prisma.skill.update({
                where: { name: create.name },
                data: { recipe: { connect: { id: update.id } } }
              })
            else
              await prisma.skill.create({
                data: {
                  ...skill,
                  recipe: { connect: { id: update.id } }
                }
              })
          }
        }

        return {
          recipe: await prisma.recipe.findUnique({
            where: { id: req.recipeId },
            include: {
              inputs: true,
              outputs: true,
              tools: true,
              skills: true
            }
          })
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.updateAction, async req => {
    return await execute(
      req,
      async (req, app) => {
        return {
          action: await prisma.action.update({
            where: { id: req.actionId },
            data: {
              locations: req.new.locations,
              tools: req.new.tools.map(tool => tool.toLowerCase()),
              branch: JSON.parse(req.new.branch)
            }
          })
        }
      },
      mappedPermissionValues.ADMIN
    )
  })

  router.rpc(BagService, BagService.methods.deleteInstance, async req => {
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

        const deleted = await prisma.instance.update({
          where: { id: req.instanceId },
          data: {
            identity: { disconnect: true }
          }
        })
        return { deletedInstance: deleted }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.closeTrade, async req => {
    return await execute(
      req,
      async (req, app) => {
        let trade: TradeWithTrades = await prisma.trade.findUnique({
          where: {
            id: req.tradeId
          },
          include: {
            initiatorTrades: true,
            receiverTrades: true
          }
        })
        if (!trade) throw new Error('Trade not found')
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificTrades.find(tradeId => tradeId === trade.id)
        )
          throw new Error('Invalid permissions')

        // Transfer between users
        const initiator = await prisma.identity.findUnique({
          where: {
            slack: trade.initiatorIdentityId
          },
          include: {
            inventory: true
          }
        })
        const receiver = await prisma.identity.findUnique({
          where: {
            slack: trade.receiverIdentityId
          },
          include: {
            inventory: true
          }
        })

        await Promise.all(
          initiator.inventory.map(async instance => {
            const tradeInstance = trade.initiatorTrades.find(
              tradeInstance => tradeInstance.instanceId === instance.id
            )
            if (tradeInstance) {
              if (tradeInstance.quantity < instance.quantity) {
                await prisma.instance.update({
                  where: {
                    id: instance.id
                  },
                  data: {
                    quantity: instance.quantity - tradeInstance.quantity
                  }
                })
                await prisma.instance.create({
                  data: {
                    itemId: instance.itemId,
                    identityId: receiver.slack,
                    quantity: tradeInstance.quantity,
                    public: instance.public
                  }
                })
              } else {
                // Transfer entire instance over
                await prisma.instance.update({
                  where: {
                    id: instance.id
                  },
                  data: {
                    identityId: receiver.slack
                  }
                })
              }
            }
          })
        )
        await Promise.all(
          receiver.inventory.map(async instance => {
            const tradeInstance = trade.receiverTrades.find(
              tradeInstance => tradeInstance.instanceId === instance.id
            )
            if (tradeInstance) {
              if (tradeInstance.quantity < instance.quantity) {
                await prisma.instance.update({
                  where: {
                    id: instance.id
                  },
                  data: {
                    quantity: instance.quantity - tradeInstance.quantity
                  }
                })
                await prisma.instance.create({
                  data: {
                    itemId: instance.itemId,
                    identityId: initiator.slack,
                    quantity: tradeInstance.quantity,
                    public: instance.public
                  }
                })
              } else {
                // Transfer entire instance over
                await prisma.instance.update({
                  where: {
                    id: instance.id
                  },
                  data: {
                    identityId: initiator.slack
                  }
                })
              }
            }
          })
        )

        // Apps can close trades without both sides agreeing. This is so trades can be used to simulate other behavior, but also because it makes it more fun.
        let closed = await prisma.trade.update({
          where: {
            id: req.tradeId
          },
          data: {
            closed: true
          }
        })

        return {
          trade: closed,
          initiator: await prisma.identity.findUnique({
            where: {
              slack: closed.initiatorIdentityId
            }
          }),
          receiver: await prisma.identity.findUnique({
            where: {
              slack: closed.receiverIdentityId
            }
          })
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })
}
