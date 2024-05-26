import config from '../../config'
import { elastic } from '../analytics'
import { prisma } from '../db'
import { err } from '../logger'
import { mappedPermissionValues } from '../permissions'
import { kickoff } from '../queue/kickoff'
import { inMaintainers, maintainers } from '../utils'
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
  HTTPReceiver,
  LogLevel
} from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import { LRUCache } from 'lru-cache'

export const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 60 * 24
})

const slack = new App({
  token: config.SLACK_BOT_TOKEN,
  appToken: config.SLACK_APP_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET,
  logLevel: config.NODE_ENV === 'development' ?  LogLevel.DEBUG : LogLevel.ERROR,
  receiver: new HTTPReceiver({
    signingSecret: config.SLACK_SIGNING_SECRET
  })
})

// A bunch of function overloads, I know
export type CommandMiddleware = SlackCommandMiddlewareArgs &
  AllMiddlewareArgs<StringIndexed>
export type EventMiddleware = SlackEventMiddlewareArgs<'app_mention'> &
  AllMiddlewareArgs<StringIndexed>
export type ViewMiddleware = SlackViewMiddlewareArgs<SlackViewAction> &
  AllMiddlewareArgs<StringIndexed>
export type ActionMiddleware = SlackActionMiddlewareArgs &
  AllMiddlewareArgs<StringIndexed>
export type Middleware = CommandMiddleware | EventMiddleware | ViewMiddleware

// @ts-expect-error
export async function execute(
  props: SlackActionMiddlewareArgs,
  func: (
    props: SlackActionMiddlewareArgs,
    permission?: PermissionLevels
  ) => any,
  permission?: number,
  limit?: boolean
)
export async function execute(
  props: CommandMiddleware,
  func: (props: CommandMiddleware, permission?: number) => any,
  permission?: number,
  limit?: boolean
)
export async function execute(
  props: EventMiddleware,
  func: (props: EventMiddleware, permission?: number) => any,
  permission?: number,
  limit?: boolean
)
export async function execute(
  props: ViewMiddleware,
  func: (props: ViewMiddleware, permission?: number) => any,
  permission?: number,
  limit?: boolean
)
export async function execute(
  props: ActionMiddleware,
  func: (props: ActionMiddleware, permission?: number) => any,
  permission?: number,
  limit?: boolean
)
export async function execute(
  props: Middleware,
  func: (props: Middleware, permission?: number) => any,
  permission: number = mappedPermissionValues.READ,
  limit: boolean = false
) {
  try {
    if (props.ack) await props.ack()

    if (limit) {
      const curr = cache.get(props.context.userId)
      console.log('Cache', props.context.userId, curr)
      if (curr === undefined) cache.set(props.context.userId, 1)
      else if (Number(curr) > config.SLACK_RATE_LIMIT + 1)
        return // Even sending messages can make the bot hit Slack API rate limits, so let's only do that one time
      else if (Number(curr) > config.SLACK_RATE_LIMIT && Number(curr !== 999)) {
        await props.client.chat.postEphemeral({
          channel: props.context.userId,
          user: props.context.userId,
          text: "Wow, you're tired from all this hard work. Rest up and come back tomorrow!"
        })
        cache.set(props.context.userId, 999)
      } else cache.set(props.context.userId, Number(curr) + 1)
    }

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
          slack: props.context.userId,
          permissions: inMaintainers(props.context.userId)
            ? PermissionLevels.ADMIN
            : undefined
        }
      })
      // Newbies get nothing until they run /bag me, and that kicks off the old man, but they can only get common items (items with a rarity > 0.4)
      if (!inMaintainers(props.context.userId))
        await kickoff(props.context.userId)
    }

    const permissionLevel = mappedPermissionValues[user.permissions]
    if (!(permissionLevel >= permission))
      return await props.client.chat.postEphemeral({
        channel: user.slack,
        user: user.slack,
        text: "Oh no! Looks like you don't have the perms to do that."
      })

    await func(props, mappedPermissionValues[user.permissions])
  } catch (error) {
    console.log(error.code, error)
    await props.client.chat.postMessage({
      channel: maintainers.rivques,
      user: maintainers.rivques,
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
