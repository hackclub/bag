import {
  App,
  ExpressReceiver,
  SlackCommandMiddlewareArgs,
  SlackViewMiddlewareArgs,
  SlackViewAction,
  AllMiddlewareArgs,
  SlackEventMiddlewareArgs,
  SlackActionMiddlewareArgs
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import config from '../../config'
import messages from './messages'
import views from './views'
import { mappedPermissionValues } from '../permissions'
import { PrismaClient, PermissionLevels } from '@prisma/client'
import { err, log } from '../logger'
import { app } from '../api/init'
import { v4 as uuid } from 'uuid'
import { getKeyByValue, channels } from '../utils'
import { findOrCreateIdentity } from '../db'

const prisma = new PrismaClient()

const receiver = new ExpressReceiver({
  signingSecret: config.SLACK_SIGNING_SECRET,
  app
})

const slack = new App({
  token: config.SLACK_BOT_TOKEN,
  appToken: config.SLACK_APP_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET,
  receiver
})

// A bunch of function overloads, I know
type CommandMiddleware = SlackCommandMiddlewareArgs &
  AllMiddlewareArgs<StringIndexed>
type EventMiddleware = SlackEventMiddlewareArgs<'app_mention'> &
  AllMiddlewareArgs<StringIndexed>
type ViewMiddleware = SlackViewMiddlewareArgs<SlackViewAction> &
  AllMiddlewareArgs<StringIndexed>
type Middleware = CommandMiddleware | EventMiddleware | ViewMiddleware

// @ts-expect-error
export async function execute(
  props: SlackActionMiddlewareArgs,
  func: (
    props: SlackActionMiddlewareArgs,
    permission?: PermissionLevels
  ) => any,
  permission?: number
)
export async function execute(
  props: CommandMiddleware,
  func: (props: CommandMiddleware, permission?: number) => any,
  permission?: number
)
export async function execute(
  props: EventMiddleware,
  func: (props: EventMiddleware, permission?: number) => any,
  permission?: number
)
export async function execute(
  props: ViewMiddleware,
  func: (props: ViewMiddleware, permission?: number) => any,
  permission?: number
)
export async function execute(
  props: Middleware,
  func: (props: Middleware, permission?: number) => any,
  permission: number = mappedPermissionValues.READ
) {
  try {
    if (props.ack) await props.ack()

    // Ensure there are enough permissions to continue running
    let user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      }
    })

    if (!user) {
      // Not in database yet... create user
      user = await prisma.identity.create({
        data: {
          slack: props.context.userId
        }
      })

      // For now, temporarily block if it's not in whitelist
      // For now, temporarily block if it's not in whitelist
      if (
        !['U03MNFDRSGJ', 'UDK5M9Y13', 'U032A2PMSE9', 'U05TXCSCK7E'].includes(
          user.slack
        )
      )
        return await props.client.chat.postMessage({
          channel: user.slack,
          user: user.slack,
          text: "You found something... but it's not quite ready yet."
        })
    }

    const permissionLevel = mappedPermissionValues[user.permissions]
    if (!(permissionLevel >= permission))
      return await props.client.chat.postEphemeral({
        channel: user.slack,
        user: user.slack,
        text: messages.invalidPerms
      })

    await func(props, mappedPermissionValues[user.permissions])
  } catch (error) {
    err(error)
    props.client.chat.postMessage({
      channel: props.context.userId,
      user: props.context.userId,
      blocks: views.error(`Oops, there was an error:
\`\`\`
${error}
\`\`\`
Try again?`)
    })
  }
}

slack.error(async error => {
  err(error)
})

slack.command('/bag-item', async props => {
  await execute(props, async (props, permission) => {
    const message = props.command.text
    const command = message.split(' ')[0]

    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      }
    })

    switch (command) {
      case 'list':
        let items = await prisma.item.findMany()
        if (permission < mappedPermissionValues.READ_PRIVATE)
          items = items.filter(item => item.public)
        else if (permission < mappedPermissionValues.WRITE)
          items = items.filter(
            item =>
              item.public ||
              user.specificItems.find(itemId => itemId === item.name)
          )
        const formatted = items.map(item => views.getItem(item))
        return await props.client.chat.postMessage({
          channel: props.body.channel_id,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Here's a list of all the ${
                  permission < mappedPermissionValues.READ_PRIVATE
                    ? 'public '
                    : ''
                }items currently in the bag:`
              }
            },
            ...formatted.map(itemBlock => itemBlock[0]),
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: "If you'd like to snap your fingers like Thanos and suggest an item to be added to the bag, you can run `/bag-item create`!"
              }
            }
          ]
        })
      case 'search':
        try {
          const query = message.split(' ').slice(1).join('')
          if (query[0] !== '`' || query[query.length - 1] !== '`')
            throw new Error()
          let items = await prisma.item.findMany({
            where: JSON.parse(query.slice(1, query.length - 1))
          })
          if (!items.length) throw new Error()

          if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.READ_PRIVATE
          )
            items = items.filter(item => item.public)
          if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.WRITE
          )
            items = items.filter(
              item =>
                item.public ||
                user.specificItems.find(itemId => itemId === item.name)
            )

          const formatted = items.map(item => views.getItem(item))
          return await props.client.chat.postMessage({
            channel: props.body.channel_id,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `Here's a list of all the items in the bag that match ${query}:`
                }
              },
              ...formatted.map(itemBlock => itemBlock[0])
            ]
          })
        } catch {
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            text: "Oh no! Couldn't find any items matching your query. Make sure your query is properly formatted - that is, a valid JSON query encased in a `code snippet`."
          })
        }
      case 'edit':
        try {
          const name = message.split(' ')[1]
          const item = await prisma.item.findUnique({
            where: {
              name
            }
          })

          if (!item) throw new Error()
          if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.WRITE_SPECIFIC
          )
            throw new Error()
          if (
            user.permissions === PermissionLevels.WRITE_SPECIFIC &&
            !user.specificItems.find(itemId => itemId === item.name)
          )
            throw new Error()

          await props.client.views.open({
            trigger_id: props.body.trigger_id,
            view: views.editItem(item)
          })
        } catch {
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            text: "Oh no! To edit an item you'll need to provide the name of the item and have the appropriate permissions."
          })
        }
        break
      case 'create':
        // If admin, form directly creates item; otherwise, it opens a request to maintainers
        return await props.client.views.open({
          trigger_id: props.body.trigger_id,
          view: views.createItem
        })
      default:
        // Either list item, or if no message is provided, show options
        if (message === '') {
          // List options
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            blocks: views.itemDialog
          })
        } else {
          try {
            const item = await prisma.item.findUnique({
              where: {
                name: props.command.text
              }
            })

            if (!item) throw new Error()
            if (user.permissions === PermissionLevels.READ && !item.public)
              throw new Error()
            if (
              mappedPermissionValues[user.permissions] <
                mappedPermissionValues.WRITE &&
              !item.public &&
              !user.specificItems.find(itemId => itemId === item.name)
            )
              throw new Error()

            return await props.client.chat.postMessage({
              channel: props.body.channel_id,
              user: props.context.userId,
              blocks: views.getItem(item)
            })
          } catch {
            return await props.client.chat.postEphemeral({
              channel: props.body.channel_id,
              user: props.context.userId,
              text: `Oops, couldn't find a item named *${message}*.`
            })
          }
        }
    }
  })
})

// TODO: Should allow existing items to give permissions to new apps

slack.view('edit-item', async props => {
  await execute(props, async props => {
    let fields: {
      name: string
      image: string
      description: string
      reaction: string
      commodity: boolean
      tradable: boolean
      public: boolean
    } = {
      name: undefined,
      image: undefined,
      description: undefined,
      reaction: undefined,
      commodity: undefined,
      tradable: undefined,
      public: undefined
    }
    for (let field of Object.values(props.view.state.values)) {
      if (field[Object.keys(field)[0]].value === null) continue
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]].value ||
        Object.values(field)[0].selected_option.value ||
        ''
      if (fields[Object.keys(field)[0]] === 'true')
        fields[Object.keys(field)[0]] = true
      else if (fields[Object.keys(field)[0]] === 'false')
        fields[Object.keys(field)[0]] = false
    }

    const { prevName } = JSON.parse(props.view.private_metadata)

    const item = await prisma.item.update({
      where: {
        name: prevName
      },
      data: fields
    })

    await props.client.chat.postMessage({
      channel: props.context.userId,
      user: props.context.userId,
      text: `Updated *${item.name}* successfully.`
    })
  })
})

slack.view('create-item', async props => {
  await execute(
    props,
    async props => {
      let fields: {
        name: string
        reaction: string
        description: string
        commodity: boolean
        tradable: boolean
        public: boolean
      } = {
        name: undefined,
        reaction: undefined,
        description: undefined,
        commodity: undefined,
        tradable: undefined,
        public: undefined
      }
      for (let field of Object.values(props.view.state.values)) {
        fields[Object.keys(field)[0]] =
          field[Object.keys(field)[0]].value ||
          Object.values(field)[0].selected_option.value ||
          ''
        if (fields[Object.keys(field)[0]] === 'true')
          fields[Object.keys(field)[0]] = true
        else if (fields[Object.keys(field)[0]] === 'false')
          fields[Object.keys(field)[0]] = false
      }

      const user = await prisma.identity.findUnique({
        where: {
          slack: props.context.userId
        }
      })
      if (user.permissions !== PermissionLevels.ADMIN) {
        // Request to create item
        await props.client.chat.postMessage({
          channel: user.slack,
          text: 'Item creation request made! You should get a response sometime in the next 24 hours if today is a weekday, and 72 hours otherwise!'
        })
        return await props.client.chat.postMessage({
          channel: channels.approvals,
          blocks: views.approveOrDenyItem(fields, props.context.userId)
        })
      }

      // Create item
      const item = await prisma.item.create({
        data: fields
      })
      log('New item created: ', item.name)
      await props.client.chat.postMessage({
        channel: props.context.userId,
        user: props.context.userId,
        text: `New item created: ${item.name} ${item.reaction}`
      })
    },
    mappedPermissionValues.ADMIN
  )
})

slack.action('approve-item', async props => {
  await execute(props, async props => {
    try {
      // @ts-expect-error
      let { user, item: fields } = JSON.parse(props.action.value)

      // Create item, and add to user's list of items they can access
      const item = await prisma.item.create({
        data: fields
      })
      log('New item created: ', item.name)

      await prisma.identity.update({
        where: {
          slack: user
        },
        data: {
          specificItems: { push: item.name }
        }
      })

      // @ts-expect-error
      await props.client.chat.postMessage({
        channel: user,
        user,
        text: `New item approved and created: ${item.name} ${item.reaction}`
      })
    } catch {
      await props.say('Already applied.')
    }
  })
})

slack.action('deny-item', async props => {
  await execute(props, async props => {
    try {
      // @ts-expect-error
      let { user, item } = JSON.parse(props.action.value)

      // @ts-expect-error
      await props.client.chat.postMessage({
        channel: user,
        text: `Your request to create ${item.name} ${item.reaction} was denied.`
      })
    } catch {
      return await props.say('Already applied.')
    }
  })
})

slack.command('/bag-app', async props => {
  await execute(props, async (props, permission) => {
    const message = props.command.text
    const command = message.split(' ')[0]

    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      }
    })

    switch (command) {
      case 'list':
        let apps = await prisma.app.findMany()
        if (permission < mappedPermissionValues.READ_PRIVATE)
          apps = apps.filter(app => app.public)
        let formatted = apps.map(app => views.getApp(app))
        return await props.client.chat.postMessage({
          channel: props.body.channel_id,
          user: props.context.userId,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Here's a list of all the ${
                  permission < mappedPermissionValues.READ_PRIVATE
                    ? 'public '
                    : ''
                }apps currently in the bag:`
              }
            },
            ...formatted.map(appBlock => appBlock[0]),
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'You can write your own! Start by running `/create-app`.'
              }
            }
          ]
        })
      case 'search':
        try {
          const query = message.split(' ').slice(1).join('')
          if (query[0] !== '`' || query[query.length - 1] !== '`')
            throw new Error()
          let apps = await prisma.app.findMany({
            where: JSON.parse(query.slice(1, query.length - 1))
          })
          if (!apps.length) throw new Error()

          if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.READ_PRIVATE
          )
            apps = apps.filter(app => app.public)
          if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.ADMIN
          )
            apps = apps.filter(
              app =>
                app.public || app.specificApps.find(appId => appId === app.id)
            )

          const formatted = apps.map(app => views.getApp(app))
          return await props.client.chat.postMessage({
            channel: props.body.channel_id,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `Here's a list of all the apps in the bag that match ${query}:`
                }
              },
              ...formatted.map(appBlock => appBlock[0])
            ]
          })
        } catch {}
      case 'edit':
        try {
          const [id, key] = props.body.text.split(' ')
          if (Number.isNaN(Number(id)))
            return await props.client.chat.postEphemeral({
              channel: props.body.channel_id,
              user: props.context.userId,
              text: 'Oh no! Looks like you provided an invalid ID for the app.'
            })
          const app = await prisma.app.findUnique({
            where: {
              id: Number(id),
              AND: [{ key }]
            }
          })

          if (!app)
            return await props.client.chat.postEphemeral({
              channel: props.body.channel_id,
              user: props.context.userId,
              text: 'Oh no! App not found, or an incorrect key was used.'
            })

          return await props.client.views.open({
            trigger_id: props.body.trigger_id,
            view: views.editApp(app)
          })
        } catch {
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            text: "Oh no! To edit an app you'll need to provide an ID and key"
          })
        }
      case 'create':
        return await props.client.views.open({
          trigger_id: props.body.trigger_id,
          view: views.createApp(user.permissions)
        })
      default:
        if (message === '') {
          return await props.client.chat.postMessage({
            channel: props.body.channel_id,
            user: props.context.userId,
            blocks: views.appDialog
          })
        } else {
          try {
            const app = await prisma.app.findUnique({
              where: {
                name: message
              }
            })

            if (!app) throw new Error()
            if (user.permissions === PermissionLevels.READ && !app.public)
              throw new Error()
            if (
              mappedPermissionValues[user.permissions] <
                mappedPermissionValues.ADMIN &&
              !app.public &&
              !user.specificApps.find(appId => appId === app.id)
            )
              throw new Error()

            return await slack.client.chat.postMessage({
              channel: props.body.channel_id,
              user: props.context.userId,
              blocks: views.getApp(app)
            })
          } catch {
            return await slack.client.chat.postEphemeral({
              channel: props.body.channel_id,
              user: props.context.userId,
              text: `Oops, couldn't find an app named *${props.command.text}*.`
            })
          }
        }
    }
  })
})

// TODO: Should allow existing apps to give permissions to new apps

slack.view('create-app', async props => {
  await execute(props, async props => {
    let fields: {
      name: string
      description: string
      permissions: PermissionLevels
    } = {
      name: '',
      description: '',
      permissions: undefined
    }
    for (let field of Object.values(props.view.state.values))
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]].value ||
        Object.values(field)[0].selected_option.value ||
        ''

    // Apps, by default, can read everything that's public
    // But, if they're created by an admin, you can pass in any option
    const userId = props.context.userId

    // Make sure app doesn't exist yet
    if (
      await prisma.app.findUnique({
        where: {
          name: fields.name
        }
      })
    )
      throw new Error('Name is already being used')

    // Create app
    try {
      const app = await prisma.app.create({
        data: {
          name: fields.name,
          key: uuid(),
          description: fields.description,
          permissions: fields.permissions
        }
      })
      return await props.client.chat.postMessage({
        channel: userId,
        blocks: views.createdApp(app)
      })
    } catch (err) {
      return await props.client.chat.postMessage({
        channel: userId,
        blocks: views.error(
          `Oops, there was an error trying to deploy your app:
\`\`\`${err.toString()}.
\`\`\`
Try again?`
        )
      })
    }
  })
})

slack.view('edit-app', async props => {
  await execute(props, async props => {
    let fields: {
      'name': string
      'description': string
      'public': boolean
      'permissions': PermissionLevels
      'delete-app': string
    } = {
      'name': '',
      'description': '',
      'public': false,
      'permissions': undefined,
      'delete-app': undefined
    }
    for (let field of Object.values(props.view.state.values)) {
      if (field[Object.keys(field)[0]].value === null) continue
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]].value ||
        Object.values(field)[0].selected_option.value ||
        ''
      if (fields[Object.keys(field)[0]] === 'true')
        fields[Object.keys(field)[0]] = true
      else if (fields[Object.keys(field)[0]] === 'false')
        fields[Object.keys(field)[0]] = false
    }

    const { prevName } = JSON.parse(props.view.private_metadata)

    if (fields['delete-app']) {
      // Send user notification that their app was deleted
      let app = await prisma.app.findUnique({
        where: {
          name: prevName,
          key: fields['delete-app']
        }
      })
      if (!app)
        return await props.client.chat.postEphemeral({
          channel: props.context.userId,
          user: props.context.userId,
          text: `Unable to delete *${app.name}* - you provided the wrong key.`
        })
      await prisma.app.delete({
        where: {
          name: prevName,
          key: fields['delete-app']
        }
      })
      return await props.client.chat.postMessage({
        channel: props.context.userId,
        user: props.context.userId,
        text: `Deleted *${app.name}*.`
      })
    }

    let app = await prisma.app.findUnique({
      where: {
        name: prevName
      }
    })

    // Request permissions if changed
    if (
      mappedPermissionValues[app.permissions] >
      mappedPermissionValues[fields.permissions]
    ) {
      // Give downgrade without permissions
      await prisma.app.update({
        where: {
          name: prevName
        },
        data: {
          permissions: fields.permissions
        }
      })
    } else if (app.permissions !== fields.permissions) {
      await props.client.chat.postMessage({
        channel: channels.approvals,
        blocks: views.approveOrDenyAppPerms(
          app,
          fields.permissions as PermissionLevels
        )
      })
    }

    delete fields.permissions
    app = await prisma.app.update({
      where: {
        name: prevName
      },
      data: fields
    })
    await props.client.chat.postMessage({
      channel: props.context.userId,
      user: props.context.userId,
      text: `Updated *${app.name}* successfully.`
    })
  })
})

slack.command('/bag-request-perms', async props => {
  await execute(props, async props => {
    // Let user request permissions
    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      }
    })
    return await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: views.requestPerms(user)
    })
  })
})

slack.view('user-request-perms', async props => {
  await execute(props, async props => {
    let permissions = Object.values(props.view.state.values)[0].permissions
      .selected_option.value
    await props.client.chat.postMessage({
      channel: channels.approvals,
      blocks: views.approveOrDenyPerms(
        props.context.userId,
        permissions as PermissionLevels
      )
    })
    await props.client.chat.postMessage({
      channel: props.context.userId,
      user: props.context.userId,
      text: 'Permission request made! You should get a response sometime in the next 24 hours if today is a weekday, and 72 hours otherwise!'
    })
  })
})

slack.action('user-approve-perms', async props => {
  await execute(props, async props => {
    try {
      // @ts-expect-error
      let { user: userId, permissions } = JSON.parse(props.action.value)
      permissions = getKeyByValue(mappedPermissionValues, permissions)

      // Approve user
      await prisma.identity.update({
        where: {
          slack: userId
        },
        data: {
          permissions: permissions as PermissionLevels
        }
      })
      await props.say(
        `${
          permissions[0].toUpperCase() + permissions.slice(1)
        } for <@${userId}> approved.`
      )

      // Let user know
      // @ts-expect-error
      await props.client.chat.postMessage({
        channel: userId,
        text: `Your request for ${
          permissions[0].toUpperCase() + permissions.slice(1)
        } permissions was approved!`
      })
    } catch {
      return await props.say('Permissions already applied.')
    }
  })
})

slack.action('user-deny-perms', async props => {
  await execute(props, async props => {
    try {
      // Let user know
      // @ts-expect-error
      let { user: userId, permissions } = JSON.parse(props.action.value)
      permissions = getKeyByValue(mappedPermissionValues, permissions)

      // @ts-expect-error
      await props.client.chat.postMessage({
        channel: userId,
        text: `Your request for ${permissions} permissions was rejected.`
      })
    } catch {
      return await props.say('Permissions already applied.')
    }
  })
})

slack.command('/bag-trade', async props => {
  await execute(props, async props => {
    if (!/^<@[A-Z0-9]+\|[\d\w\s]+>$/gm.test(props.command.text))
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: 'Oh no! You need to mention a user in order to start a trade with them.'
      })

    const receiver = props.command.text.slice(
      2,
      props.command.text.indexOf('|')
    )

    // Create trade
    const trade = await prisma.trade.create({
      data: {
        initiatorIdentityId: props.context.userId,
        receiverIdentityId: receiver
      }
    })

    await props.client.chat.postMessage({
      channel: props.body.channel_id,
      blocks: views.startTrade(props.context.userId, receiver, trade)
    })
  })
})

slack.action('update-trade', async props => {
  await execute(props, async props => {
    // TODO: Make sure user is allowed to update trade
    // @ts-expect-error
    const id = props.action.value
    const trade = await prisma.trade.findUnique({
      where: {
        id: Number(id)
      }
    })

    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return props.say(
        "Oh no! You'll allowed to spectate on the trade and that's it."
      )

    // @ts-expect-error
    await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.body.trigger_id,
      view: await views.tradeDialog(
        await prisma.identity.findUnique({
          where: {
            slack: props.body.user.id
          },
          include: {
            inventory: true
          }
        })
      )
    })
  })
})

slack.action('close-trade', async props => {
  await execute(props, async props => {
    // Close trade, transfer items between users
    // @ts-expect-error
    const id: number = Number(props.action.value)
    const trade = await prisma.trade.findUnique({
      where: {
        id
      }
    })

    console.log(trade, props.body.user.id)
    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return await props.say("Oh no! You can't close this trade.")
    return

    // Make sure both sides have agreed
    if (!trade.initiatorAgreed || !trade.receiverAgreed) return props.say('')

    return

    await prisma.trade.update({
      where: { id },
      data: { closed: true }
    })
  })
})

slack.command('/bag-inventory', async props => {
  await execute(props, async props => {
    const message = props.command.text
    if (message.startsWith('me')) {
      const userId = props.context.userId
      const user = await prisma.identity.findUnique({
        where: {
          slack: userId
        },
        include: {
          inventory: true
        }
      })
      if (message !== 'me private')
        user.inventory = user.inventory.filter(item => item.public)

      return await props.respond({
        response_type: 'in_channel',
        blocks: await views.showInventory(user)
      })
    }
    if (message.startsWith('<@')) {
      // Mentioning user
      const mentionId = message.slice(2, message.indexOf('|'))
      const mention = await findOrCreateIdentity(mentionId)

      return await props.respond({
        response_type: 'in_channel',
        blocks: await views.showInventory(mention)
      })
    }
    await props.respond({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: "Sorry, can't help you with that, I'm just a measly bag, it's the stuff inside that's useful... maybe this is helpful? :point_down:"
          }
        },
        ...views.helpDialog
      ]
    })
  })
})

slack.event('app_mention', async props => {
  await execute(props, async props => {
    const removeUser = (text: string) => {
      let i
      for (i = 0; text[i - 2] != '>'; i++) {} // 2 to deal with the space that comes afterward
      return text.slice(i)
    }

    const message = removeUser(props.event.text)
    switch (message) {
      case 'help':
        await props.client.chat.postMessage({
          channel: props.event.channel,
          user: props.context.userId,
          blocks: views.helpDialog
        })
        break
      default:
        if (message.startsWith('me')) {
          const userId = props.context.userId
          const user = await prisma.identity.findUnique({
            where: {
              slack: userId
            },
            include: {
              inventory: true
            }
          })
          if (message !== 'me private')
            user.inventory = user.inventory.filter(item => item.public)

          await props.client.chat.postMessage({
            channel: props.event.channel,
            blocks: await views.showInventory(user)
          })

          break
        } else if (message.startsWith('<@')) {
          // Mentioning user
          const mentionId = message.slice(2, message.length - 1) // Remove the formatted ID
          const mention = await findOrCreateIdentity(mentionId)

          await props.client.chat.postMessage({
            channel: props.event.channel,
            blocks: await views.showInventory(mention)
          })

          break
        }
        await props.client.chat.postEphemeral({
          channel: props.event.channel,
          user: props.context.userId,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: "Sorry, can't help you with that, I'm just a measly bag, it's the stuff inside that's useful... maybe this is helpful? :point_down:"
              }
            },
            ...views.helpDialog
          ]
        })
    }
  })
})

export default slack
