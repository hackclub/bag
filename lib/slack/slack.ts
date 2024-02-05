import config from '../../config'
import routes from '../../routes'
import { prisma } from '../db'
import { err } from '../logger'
import { mappedPermissionValues } from '../permissions'
import { kickoff } from '../scripts/old-man'
import { maintainers } from '../utils'
import CustomReceiver from './receiver'
import views from './views'
import { PermissionLevels } from '@prisma/client'
import {
  App,
  SlackCommandMiddlewareArgs,
  SlackViewMiddlewareArgs,
  SlackViewAction,
  AllMiddlewareArgs,
  SlackEventMiddlewareArgs,
  SlackActionMiddlewareArgs,
  HTTPReceiver
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'

export const receiver = new HTTPReceiver({
  signingSecret: config.SLACK_SIGNING_SECRET
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
type ActionMiddleware = SlackActionMiddlewareArgs &
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
  props: ActionMiddleware,
  func: (props: ActionMiddleware, permission?: number) => any,
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
      // Newbies get nothing until they run /bag me, and that kicks off the old man, but they can only get common items (items with a rarity > 0.4)
      await kickoff(props.context.userId)
    }

    // For now, temporarily block if it's not in whitelist
    // if (
    //   ![
    //     'U03MNFDRSGJ',
    //     'UDK5M9Y13',
    //     'U032A2PMSE9',
    //     'U05TXCSCK7E',
    //     'U0C7B14Q3'
    //   ].includes(user.slack)
    // )
    //   return await props.client.chat.postMessage({
    //     channel: user.slack,
    //     user: user.slack,
    //     text: "You found something... but it's not quite ready yet."
    //   })

    const permissionLevel = mappedPermissionValues[user.permissions]
    if (!(permissionLevel >= permission))
      return await props.client.chat.postEphemeral({
        channel: user.slack,
        user: user.slack,
        text: "Oh no! Looks like you don't have the perms to do that."
      })

    await func(props, mappedPermissionValues[user.permissions])
  } catch (error) {
    err(error)
    console.log(error.code, error)
    await props.client.chat.postMessage({
      channel: maintainers.jc,
      user: maintainers.jc,
      blocks: views.error(`Oops, there was an error:
\`\`\`
${error}
\`\`\`
Try again?`)
    })
    await props.client.chat.postMessage({
      channel: props.context.userId,
      user: props.context.userId,
      blocks:
        process.env.NODE_ENV === 'development'
          ? views.error(`Oops, there was an error:
\`\`\`
${error}
\`\`\`
Try again?`)
          : views.error('Oops, there was an error. Try again?')
    })
  }
}

slack.error(async error => {
  err(error)
})

export default slack
