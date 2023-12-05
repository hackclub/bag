import {
  App,
  ExpressReceiver,
  View,
  SlackCommandMiddlewareArgs,
  SlackViewMiddlewareArgs,
  SlackViewAction,
  AllMiddlewareArgs,
  SlackEventMiddlewareArgs
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import config from '../../config'
import { Identities, Items } from '../../db/client'
import messages from './messages'
import views from './views'
import { mappedPermissionValues } from '../permissions'
import { Item } from '@prisma/client'
import { err, log } from '../logger'
import { app } from '../api/init'

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
  props: CommandMiddleware,
  func: (props: CommandMiddleware) => any,
  permission?: number
)
export async function execute(
  props: EventMiddleware,
  func: (props: EventMiddleware) => any,
  permission?: number
)
export async function execute(
  props: ViewMiddleware,
  func: (props: ViewMiddleware) => any,
  permission?: number
)
export async function execute(
  props: Middleware,
  func: (props: Middleware) => any,
  permission: number = mappedPermissionValues.READ
) {
  try {
    if (props.ack) await props.ack()

    // Ensure there are enough permissions to continue running
    let user = await Identities.find(props.context.userId)

    if (!user) {
      // Not in database yet... create user
      user = await Identities.create(props.context.userId)
    }

    const permissionLevel = mappedPermissionValues[user.permissions]
    if (!(permissionLevel >= permission))
      return await props.client.chat.postEphemeral({
        channel: user.slack,
        user: user.slack,
        text: messages.invalidPerms
      })

    await func(props)
  } catch (error) {
    err(error)
  }
}

slack.command('/about', async props => {
  await execute(props, async props => {
    await props.client.chat.postMessage({
      channel: props.context.userId,
      text: 'No secrets are coming out of the #baggie!'
    })
  })
})

slack.command('/create', async props => {
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

slack.view('create', async props => {
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

slack.command('/find-item', async props => {
  await execute(props, async props => {}, mappedPermissionValues.ADMIN)
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
      case 'me':
        const userId = props.context.userId
        const user = await Identities.find(userId)

        await props.client.chat.postMessage({
          channel: props.event.channel,
          text: `<@${userId}>${
            user.permissions === 'ADMIN' ? ' is an admin.' : ''
          }`
        })
        break
    }
  })
})

export default slack
