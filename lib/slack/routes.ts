import {
  App,
  ExpressReceiver,
  View,
  SlackCommandMiddlewareArgs,
  SlackViewMiddlewareArgs,
  SlackViewAction,
  AllMiddlewareArgs,
  SlackEventMiddlewareArgs,
  SlackActionMiddlewareArgs
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import config from '../../config'
import { Identities, Items, Apps } from '../../db/client'
import messages from './messages'
import views from './views'
import { mappedPermissionValues } from '../permissions'
import { Item, PermissionLevels, Prisma } from '@prisma/client'
import { err, log } from '../logger'
import { app } from '../api/init'
import { v4 as uuid } from 'uuid'
import { maintainers } from '../utils'

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

// ! A bunch of function overloads, I know
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
    // if (config.NODE_ENV === 'development') log(JSON.stringify(props.body))
    if (props.ack) await props.ack()

    // Ensure there are enough permissions to continue running
    let user = await Identities.find(props.context.userId)

    if (Object.values(user).includes(undefined)) {
      // Not in database yet... create user
      user = await Identities.create(props.context.userId)

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
      // Open a view for creating item
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
      let fields = {}
      for (let field of Object.values(props.view.state.values)) {
        fields[Object.keys(field)[0]] = field[Object.keys(field)[0]].value || ''
      }

      // Create item
      const item = await Items.create(fields as Item)
      log('New item created: ', item)
    },
    mappedPermissionValues.ADMIN
  )
})

slack.command('/create-app', async props => {
  await execute(props, async props => {
    const user = await Identities.find(props.context.userId)
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
    for (let field of Object.values(props.view.state.values)) {
      fields[Object.keys(field)[0]] = field[Object.keys(field)[0]].value || ''
    }

    // Apps, by default, can read everything that's public
    // But, if they're created by an admin, you can pass in any option
    // Response lets you request change in permissions
    const userId = props.context.userId
    const user = await Identities.find(userId)

    console.log(fields.permissions)

    // Create app
    let uuid: string
    try {
      const app = await Apps.create(
        fields?.name,
        fields?.description,
        fields?.permissions
      )
      uuid = app.key
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

    return await props.client.chat.postMessage({
      channel: userId,
      blocks: views.createdApp(fields?.name, uuid, user.permissions)
    })
  })
})

slack.command('/request-perms', async props => {
  await execute(props, async props => {
    // Let user request permissions
    const user = await Identities.find(props.context.userId)
    return await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: views.requestPerms(user)
    })
  })
})

slack.view('request-perms', async props => {
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
  })
})

slack.action('approve-perms', async props => {
  await execute(props, async props => {
    // Approve user
    // console.log(props.action.value)
  })
})

slack.action('deny-perms', async props => {
  await execute(props, async props => {})
})

slack.command('/edit-app', async props => {
  await execute(props, async props => {
    const [id, key] = props.body.text.split(' ')
    if (Number.isNaN(Number(id)))
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: 'Oh no! Looks like you provided an invalid ID for the app.'
      })
    const app = await Apps.find({
      id: Number(id),
      AND: [{ key }]
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
  })
})

slack.command('/get-app', async props => {
  await execute(props, async (props, permission) => {
    const app = await Apps.find({
      name: props.command.text
    })
    if (!app || permission < mappedPermissionValues.READ_PRIVATE)
      return await slack.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: `Oh no! Looks like \`${props.command.text}\` doesn't exist.`
      })

    return await slack.client.chat.postEphemeral({
      channel: props.body.channel_id,
      user: props.context.userId,
      blocks: views.getApp(app)
    })
  })
})

slack.command('/find-item', async props => {
  await execute(props, async props => {}, mappedPermissionValues.ADMIN)
})

slack.command('/bag-apps', async props => {})

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
        await props.client.chat.postEphemeral({
          channel: props.event.channel,
          user: props.context.userId,
          blocks: views.helpDialog
        })
        break
      case 'about':
        await props.client.chat.postEphemeral({
          channel: props.event.channel,
          user: props.context.userId,
          text: await views.heehee()
        })
        break
      case 'me':
        const userId = props.context.userId
        const user = await Identities.find(userId)

        await props.client.chat.postMessage({
          channel: props.event.channel,
          blocks: views.showInventory(user)
        })

        break
      default:
        if (message.startsWith('<@')) {
          // Mentioning user
          const mentionId = message.slice(2, message.length - 1) // Remove the formatted ID
          const mention = await Identities.find(mentionId, true)

          await props.client.chat.postMessage({
            channel: props.event.channel,
            blocks: views.showInventory(mention)
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

slack.event('message', async props => {
  const channel = props.event.channel
  const easterEggChannels = ['C067VEFCV7Y', 'C067FH4PHFH']
  if (easterEggChannels.includes(channel)) {
    const user = await Identities.find(props.context.userId)
  }
})

export default slack
