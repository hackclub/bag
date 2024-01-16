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
import { getKeyByValue, maintainers } from '../utils'
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
  await execute(props, async props => {
    const command = props.command.text
    switch (command) {
      default:
        await props.client.views.open({
          trigger_id: props.body.trigger_id,
          view: views.createItem
        })
    }
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

      // * If user doesn't have admin permissions, request first
      const identity = await prisma.identity.findUnique({
        where: {
          slack: props.context.userId
        }
      })
      if (
        mappedPermissionValues[identity.permissions] !==
        mappedPermissionValues.WRITE
      ) {
        if (
          mappedPermissionValues[identity.permissions] <
          mappedPermissionValues.WRITE_SPECIFIC
        )
          return await slack.client.chat.postEphemeral({
            channel: props.context.userId,
            user: props.context.userId,
            text: 'Invalid permissions for creating items. Request first.'
          })
        else {
          // Request to create
          // TODO
          for (let maintainer of maintainers) {
            await props.client.chat.postMessage({
              channel: maintainer.slack,
              user: maintainer.slack,
              blocks: []
            })
          }
        }
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

slack.command('/bag-apps', async props => {
  await execute(props, async props => {
    const command = props.command.text
    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      }
    })
    switch (command) {
      default:
        await props.client.views.open({
          trigger_id: props.body.trigger_id,
          view: views.createApp(user.permissions)
        })
    }
  })
})

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

slack.view('request-perms', async props => {
  await execute(props, async props => {
    let permissions = Object.values(props.view.state.values)[0].permissions
      .selected_option.value
    for (let maintainer of maintainers) {
      await props.client.chat.postMessage({
        channel: maintainer.slack,
        user: maintainer.slack,
        blocks: views.approveOrDenyPerms(
          props.context.userId,
          permissions as PermissionLevels
        )
      })
    }
    await props.client.chat.postMessage({
      channel: props.context.userId,
      user: props.context.userId,
      text: 'Permission request made! You should get a response sometime in the next 24 hours if today is a weekday, and 72 hours otherwise!'
    })
  })
})

slack.action('approve-perms', async props => {
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
      return await props.say(
        'Permissions already applied, most likely by another maintainer.'
      )
    }
  })
})

slack.action('deny-perms', async props => {
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
      return await props.say(
        'Permissions already applied, most likely by another maintainer.'
      )
    }
  })
})

slack.command('/bag-apps', async props => {
  await execute(props, async props => {})
})

slack.command('/bag-trade', async props => {
  await execute(props, async props => {})
})

slack.command('/bag-items', async props => {
  await execute(props, async props => {})
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
          user: props.context.user,
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
        }
        if (message.startsWith('<@')) {
          // Mentioning user
          const mentionId = message.slice(2, message.length - 1)
          const mention = await findOrCreateIdentity(mentionId)

          await props.client.chat.postMessage({
            channel: props.event.channel,
            blocks: await views.showInventory(mention)
          })

          break
        }
    }
  })
})

export default slack
