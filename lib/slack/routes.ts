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
import { PrismaClient, PermissionLevels, Prisma } from '@prisma/client'
import { err, log } from '../logger'
import { app } from '../api/init'
import { v4 as uuid } from 'uuid'
import { maintainers } from '../utils'
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

slack.command('/create-item', async props => {
  await execute(
    props,
    async props => {
      await props.client.views.open({
        trigger_id: props.body.trigger_id,
        view: views.createItem
      })
    },
    mappedPermissionValues.ADMIN
  )
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
      for (let field of Object.values(props.view.state.values))
        fields[Object.keys(field)[0]] =
          field[Object.keys(field)[0]].value ||
          Object.values(field)[0].selected_option.value ||
          ''

      // Create item
      const item = await prisma.item.create({
        data: fields
      })
      log('New item created: ', item.name)
      await props.client.chat.postEphemeral({
        channel: props.context.userId,
        user: props.context.userId,
        text: `New item created: ${item.name}`
      })
    },
    mappedPermissionValues.ADMIN
  )
})

slack.command('/create-app', async props => {
  await execute(props, async props => {
    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      }
    })
    await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: views.createApp(user.permissions)
    })
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
    // Response lets you request change in permissions
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

    // Create UUID
    let key = uuid()
    while (await prisma.app.findUnique({ where: { key } })) key = uuid

    // Create app
    try {
      const app = await prisma.app.create({
        data: {
          name: fields.name,
          key,
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

slack.command('/request-perms', async props => {
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
  // TODO: Check to make sure this works
  await execute(props, async props => {
    let permission = Object.values(props.view.state.values)[0].permission
      .selected_option.value
    for (let maintainer of maintainers) {
      await props.client.chat.postMessage({
        channel: maintainer.slack,
        user: maintainer.slack,
        blocks: views.approveOrDenyPerms(
          props.context.userId,
          permission as PermissionLevels
        )
      })
    }
    await props.client.chat.postEphemeral({
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
      const { user: userId, permissions } = JSON.parse(props.action.value)

      // Approve user
      await prisma.identity.update({
        where: {
          slack: userId
        },
        data: {
          permissions
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
      return await props.say('Permissions already applied')
    }
  })
})

slack.action('deny-perms', async props => {
  await execute(props, async props => {
    // TODO
  })
})

slack.command('/edit-item', async props => {
  await execute(props, async props => {
    // TODO
  })
})

slack.view('edit-item', async props => {
  await execute(props, async props => {
    // TODO
  })
})

slack.command('/edit-app', async props => {
  await execute(props, async props => {
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
    } catch (err) {
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: "Oh no! To edit an app you'll need to provide an ID and key"
      })
    }
  })
})

slack.view('edit-app', async props => {
  await execute(props, async props => {
    let fields: {
      name: string
      description: string
      public: boolean
      permissions: PermissionLevels
    } = {
      name: '',
      description: '',
      public: false,
      permissions: undefined
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

    const { prevName } = JSON.parse(props.view.private_metadata)

    // Update app
    let app = await prisma.app.findUnique({
      where: {
        name: prevName
      }
    })

    // Request permissions if changed
    // TODO
    if (app.permissions !== fields.permissions) {
      for (let maintainer of maintainers)
        await props.client.chat.postMessage({
          channel: maintainer.slack,
          user: maintainer.slack,
          blocks: views.approveOrDenyAppPerms(
            // @ts-expect-error because you need to fix it, dummy
            props.context.userId,
            fields.permissions as PermissionLevels
          )
        })
    }

    delete fields.permissions
    await prisma.app.update({
      where: {
        name: prevName
      },
      data: fields
    })
    await props.client.chat.postEphemeral({
      channel: props.context.userId,
      user: props.context.userId,
      text: `Updated *${app.name}* successfully.`
    })
  })
})

slack.command('/get-app', async props => {
  await execute(props, async (props, permission) => {
    const app = await prisma.app.findUnique({
      where: {
        name: props.command.text
      }
    })
    if (!app || permission < mappedPermissionValues.READ_PRIVATE)
      return await slack.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: `Oh no! Looks like \`${props.command.text}\` doesn't exist.`
      })

    // TODO: Deal with permissions

    return await slack.client.chat.postEphemeral({
      channel: props.body.channel_id,
      user: props.context.userId,
      blocks: views.getApp(app)
    })
  })
})

slack.command('/start-trade', async props => {
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
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${props.context.userId}> just opened a trade with <@${receiver}>.\n\n Mention <@U067VQW1D9P> in the thread to add items (\`@bag add\`), remove items (\`@bag remove\`), and once both sides are done trading, click on the "Close trade" button to close the trade.`
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Close trade',
                emoji: true
              },
              style: 'danger',
              value: trade.id.toString(),
              action_id: 'close-trade'
            }
          ]
        }
      ]
    })
  })
})

slack.action('close-trade', async props => {
  await execute(props, async props => {
    // TODO
  })
})

// TODO: Very important to figure out, giving permissions to apps

slack.command('/find-item', async props => {
  await execute(
    props,
    async props => {
      // TODO
    },
    mappedPermissionValues.ADMIN
  )
})

slack.command('/bag-apps', async props => {
  await execute(props, async (props, permission) => {
    let apps = await prisma.app.findMany()
    if (permission < mappedPermissionValues.READ_PRIVATE)
      apps = apps.filter(app => app.public)
    // console.log(apps.map(app => [...views.getApp(app)]))
    // TODO: Complete
    await props.client.chat.postEphemeral({
      channel: props.body.channel_id,
      user: props.context.userId,
      text: ''
    })
  })
})

slack.command('/inventory', async props => {
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
      case 'about':
        await props.client.chat.postMessage({
          channel: props.event.channel,
          user: props.context.userId,
          text: await views.heehee()
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
          const mentionId = message.slice(2, message.length - 1) // Remove the formatted ID
          const mention = await findOrCreateIdentity(mentionId)

          await props.client.chat.postMessage({
            channel: props.event.channel,
            blocks: await views.showInventory(mention)
          })

          break
        }
        await props.client.chat.postMessage({
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
