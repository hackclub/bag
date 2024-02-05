import config from './config'
import { prisma } from './lib/db'
import type { InstanceWithItem, TradeWithTrades } from './lib/db'
import { log } from './lib/logger'
import { mappedPermissionValues } from './lib/permissions'
import { getKeyByValue } from './lib/utils'
import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import { App, PermissionLevels } from '@prisma/client'
import { WebClient } from '@slack/web-api'
import path from 'path'
import { v4 as uuid } from 'uuid'

const web = new WebClient(config.SLACK_BOT_TOKEN)

const PROTO_PATH = path.join(__dirname, 'proto/bag.proto')
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
})
const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
// @ts-expect-error
const bag = protoDescriptor.bag.BagService

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
    for (let [key, value] of Object.entries(result))
      formatted[key] = format(value)
    return formatted
  } catch (error) {
    return { response: error.toString() }
  }
}

let server = new grpc.Server()

const verifyKey = async req => {
  return await execute(req, async (_, app) => {
    if (!app) return { valid: false }
    return { valid: true }
  })
}

const createApp = async req => {
  return await execute(
    req,
    async req => {
      if (!req) throw new Error('Name of app not provided')
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
}

const createInstances = async req => {
  return await execute(
    req,
    async (req, app) => {
      let created = []
      let formatted = []

      let identity = await prisma.identity.findUnique({
        where: { slack: req.identityId },
        include: { inventory: true }
      })
      if (!identity)
        identity = await prisma.identity.create({
          data: { slack: req.identityId },
          include: { inventory: true }
        })

      for (let instance of req.instances) {
        const item = await prisma.item.findUnique({
          where: { name: instance.itemId }
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
        if (existing !== undefined)
          create = await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + Math.max(instance.quantity, 1),
              metadata: instance.metadata
                ? {
                    ...(existing.metadata as object),
                    ...JSON.parse(req.metadata)
                  }
                : existing.metadata
            },
            include: { item: true }
          })
        else
          create = await prisma.instance.create({
            data: {
              itemId: item.name,
              identityId: req.identityId,
              quantity: instance.quantity || 1,
              metadata: instance.metadata ? JSON.parse(instance.metadata) : {}
            },
            include: { item: true }
          })
        created.push(create)
        formatted.push(`x${instance.quantity} ${item.reaction} *${item.name}*`)
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
      if (req.note) text.push(`\n\n>${req.note}`)
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
}

const createInstance = async req => {
  return await execute(
    req,
    async (req, app) => {
      if (
        app.permissions === PermissionLevels.WRITE_SPECIFIC &&
        !app.specificItems.find(item => item === req.itemId)
      )
        throw new Error('Not enough permissions to create instance')

      const item = await prisma.item.findUnique({
        where: { name: req.itemId }
      })
      if (!item) throw new Error('Item not found')

      // Create instance
      let identity = await prisma.identity.findUnique({
        where: { slack: req.identityId },
        include: { inventory: true }
      })
      if (!identity)
        await prisma.identity.create({
          data: { slack: req.identityId }
        })

      let instance
      const existing = identity.inventory.find(
        instance => instance.itemId === item.name
      )
      if (existing !== undefined)
        instance = await prisma.instance.update({
          where: { id: existing.id },
          data: {
            quantity: existing.quantity + Math.max(req.quantity, 1),
            metadata: req.metadata
              ? {
                  ...(existing.metadata as object),
                  ...JSON.parse(req.metadata)
                }
              : existing.metadata
          },
          include: { item: true }
        })
      else
        instance = await prisma.instance.create({
          data: {
            itemId: item.name,
            identityId: req.identityId,
            quantity: req.quantity || 1,
            metadata: req.metadata ? JSON.parse(req.metadata) : {}
          }
        })

      // Send message to instance receiver
      let text = []
      if (req.show !== false)
        text.push(
          `*${app.name}* just sent you x${req.quantity || 1} ${
            item.reaction
          } *${item.name}*! It's in your bag now.`
        )
      if (req.note) text.push(`\n\n>${req.note}`)
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
}

const createItem = async req => {
  return await execute(
    req,
    async req => {
      if (!req.item.name || !req.item.reaction)
        throw new Error('Required fields for new items: name, reaction')
      const item = await prisma.item.create({ data: req.item })
      log('New item created: ', item.name)
      return { item }
    },
    mappedPermissionValues.ADMIN
  )
}

// TODO
const createRecipe = async req => {
  return await execute(
    req,
    async (req, app) => {
      if (!req.inputs.length || !req.outputs.length)
        throw new Error('Recipe should have inputs and outputs')
      if (app.permissions === PermissionLevels.WRITE_SPECIFIC) {
        if (app.permissions === PermissionLevels.WRITE_SPECIFIC) {
          if (
            req.inputs
              .map(input => app.specificItems.includes(input))
              .includes(false)
          )
            throw new Error('Invalid inptus')
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
              specificRecipes: { push: recipe.id }
            }
          })
        return {
          recipe: {
            ...recipe,
            inputIds: req.inputs,
            outputIds: req.outputs
          }
        }
      }
    },
    mappedPermissionValues.WRITE_SPECIFIC
  )
}

const createTrade = async req => {
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

      return { trade }
    },
    mappedPermissionValues.WRITE_SPECIFIC
  )
}

const readIdentity = async req => {
  return await execute(req, async (req, app) => {
    const user = await prisma.identity.findUnique({
      where: { slack: req.identityId },
      include: { inventory: true }
    })
    if (!user) throw new Error('Identity not found')

    if (mappedPermissionValues[app.permissions] < mappedPermissionValues.WRITE)
      user.inventory = user.inventory.filter(
        instance =>
          app.specificItems.includes(instance.itemId) || instance.public
      )
    if (app.permissions === PermissionLevels.READ)
      user.inventory = user.inventory.filter(instance => instance.public)

    return { identity: user }
  })
}

const readInventory = async req => {
  return await execute(req, async (req, app) => {
    const user = await prisma.identity.findUnique({
      where: { slack: req.identityId },
      include: { inventory: true }
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
}

const readItem = async req => {
  return await execute(req, async (req, app) => {
    const query = JSON.parse(req.query)
    let items = await prisma.item.findMany({ where: query })

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
}

const readInstance = async req => {
  return await execute(req, async (req, app) => {
    try {
      const instance = await prisma.instance.findUnique({
        where: { id: req.instanceId }
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
}

const readApp = async req => {
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
}

const readTrade = async req => {
  return await execute(req, async (req, app) => {
    try {
      const trade = await prisma.trade.findUnique({
        where: { id: req.tradeId },
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
}

const readRecipe = async req => {
  return await execute(req, async (req, app) => {
    try {
      const recipe = await prisma.recipe.findUnique({
        where: { id: req.recipeId },
        include: {
          inputs: true,
          outputs: true,
          skills: true,
          tools: true
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
          ...recipe,
          inputIds: recipe.inputs.map(input => input.name),
          outputIds: recipe.outputs.map(output => output.name),
          skillIds: recipe.skills.map(skill => skill.name),
          toolIds: recipe.tools.map(tool => tool.name)
        }
      }
    } catch {
      throw new Error('Recipe not found')
    }
  })
}

const updateIdentityMetadata = async req => {
  return await execute(
    req,
    async req => {
      const identity = await prisma.identity.findUnique({
        where: { slack: req.identityId },
        include: { inventory: true }
      })
      if (!identity) throw new Error('Identity not found')

      const updated = await prisma.identity.update({
        where: { slack: req.identityId },
        data: { metadata: JSON.parse(req.metadata) }
      })

      return { identity: updated }
    },
    mappedPermissionValues.WRITE_SPECIFIC
  )
}

const updateInstance = async req => {
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
        where: { id: req.instanceId },
        data: req.new
      })

      let text = []
      if (instance.quantity === 0) {
        // Delete instance
        instance = await prisma.instance.delete({
          where: { id: req.instanceId },
          include: { item: true }
        })

        if (req.show !== false)
          text.push(
            `*${app.name}* just removed ${
              (instance as InstanceWithItem).item.name
            } from your bag!`
          )
      } else {
        if (req.show !== false)
          text.push(
            `*${app.name}* just updated ${
              (instance as InstanceWithItem).item.name
            } from your bag!`
          )
      }
      if (req.note) text.push(`\n\n${req.note}`)
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
}

const updateItem = async req => {
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
}

const updateApp = async req => {
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
}

const updateTrade = async req => {
  return await execute(
    req,
    async (req, app) => {
      if (
        app.permissions === PermissionLevels.WRITE_SPECIFIC &&
        !app.specificTrades.find(tradeId => tradeId === req.tradeId)
      )
        throw new Error('Invalid permissions')

      const trade = await prisma.trade.findUnique({
        where: { id: req.tradeId }
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
      await prisma.trade.update({
        where: {
          id: req.tradeId
        },
        data: {
          [updateKey]: {
            push: { connect: req.add.map(instance => ({ id: instance.id })) }
          }
        }
      })
    },
    mappedPermissionValues.WRITE_SPECIFIC
  )
}

// TODO
const updateRecipe = async req => {
  return await execute(req, async (req, app) => {
    if (
      app.permissions === PermissionLevels.WRITE_SPECIFIC &&
      !app.specificRecipes.find(recipeId => recipeId === req.recipeId)
    )
      throw new Error('Invalid permissions')
    if (req.new.id !== undefined) delete req.new.id

    const inputs = req.new.inputIds
      ? req.new.inputIds.map(id => ({ id }))
      : req.new.inputs.map(input => ({ id: input.id }))
    const outputs = req.new.outputIds
      ? req.new.outputIds.map(id => ({ id }))
      : req.new.outputs.map(output => ({ id: output.id }))

    if (!inputs.length || !outputs.length)
      throw new Error('Recipe should have inputs and outputs')

    let recipe = await prisma.recipe.update({
      where: { id: req.recipeId },
      data: req.new
    })
  })
}

const deleteInstance = async req => {
  return await execute(
    req,
    async (req, app) => {
      const instance = await prisma.instance.findUnique({
        where: { id: req.instanceId }
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
}

const closeTrade = async req => {
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
}

let routes = {
  verifyKey,
  createApp,
  createInstances,
  createInstance,
  createItem,
  createRecipe,
  createTrade,
  readIdentity,
  readInventory,
  readItem,
  readInstance,
  readApp,
  readTrade,
  readRecipe,
  updateIdentityMetadata,
  updateInstance,
  updateItem,
  updateApp,
  updateTrade,
  updateRecipe,
  deleteInstance,
  closeTrade
}
for (let route of Object.keys(routes)) {
  const fn = routes[route]
  routes[route] = async (call, callback) =>
    callback(null, await fn(call.request))
}
server.addService(bag.service, routes)

server.bindAsync(
  `0.0.0.0:${config.PORT}`,
  config.NODE_ENV === 'development'
    ? grpc.ServerCredentials.createInsecure()
    : grpc.ServerCredentials.createInsecure(),
  () => {
    server.start()
    console.log(`GRPC server started on port ${config.PORT}!`)
  }
)
