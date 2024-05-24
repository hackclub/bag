import { log } from '../../analytics'
import { findOrCreateIdentity, type IdentityWithInventory } from '../../db'
import { prisma } from '../../db'
import { mappedPermissionValues } from '../../permissions'
import { channelBlacklist } from '../../utils'
import slack, { execute } from '../slack'
import views from '../views'
import { Instance } from '@prisma/client'
import { Block, KnownBlock } from '@slack/bolt'

slack.command('/rlb-bag', async props => {
  await execute(props, async props => {
    await log('slack-bag', `${props.context.userId}-${Date.now()}`, {
      channel: props.body.channel_id,
      user: (await props.client.users.info({ user: props.context.userId })).user
        .profile.display_name,
      command: `/bag ${props.command.text}`
    })

    try {
      const conversation = await props.client.conversations.info({
        channel: props.body.channel_id
      })
      if (channelBlacklist.includes(conversation.channel.name))
        return await props.respond({
          response_type: 'ephemeral',
          text: "Running `/bag` in this channel isn't allowed. Try running `/bag` in a public channel, like <#C0266FRGV>!"
        })
    } catch {}

    const message = props.command.text.trim()
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
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<@${user.slack}> ran \`/bag ${message}\`:`
            }
          },
          ...(await showInventory(user))
        ]
      })
    } else if (message.startsWith('<@')) {
      // Mentioning user
      const mentionId = message.slice(2, message.indexOf('|'))
      const mention = await findOrCreateIdentity(mentionId)

      const name = (
        await props.client.users.info({
          user: mentionId
        })
      ).user.profile.display_name

      const user = await prisma.identity.findUnique({
        where: { slack: props.context.userId }
      })
      if (
        mappedPermissionValues[user.permissions] <
        mappedPermissionValues.READ_PRIVATE
      )
        mention.inventory = mention.inventory.filter(
          instance => instance.public
        )
      else if (
        mappedPermissionValues[user.permissions] < mappedPermissionValues.WRITE
      )
        mention.inventory = mention.inventory.filter(instance =>
          user.specificItems.find(item => item === instance.itemId)
        )

      return await props.respond({
        response_type: 'in_channel',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<@${props.context.userId}> ran \`/bag ${name}\`:`
            }
          },
          ...(await showInventory(mention, name))
        ]
      })
    }
    await props.respond({
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: 'Try running `/bag me` or `/bag <mention someone>`!'
          }
        }
      ]
    })
  })
})

slack.event('app_mention', async props => {
  await execute(props, async props => {
    try {
      const conversation = await props.client.conversations.info({
        channel: props.body.event.channel
      })
      if (channelBlacklist.includes(conversation.channel.name))
        return await props.client.chat.postEphemeral({
          channel: props.body.event.channel,
          user: props.context.userId,
          text: "Mentioning me in this channel isn't allowed. Try mentioning me in a public channel, like <#C0266FRGV>!"
        })
    } catch {}

    const thread_ts = props.body.event.thread_ts

    const removeUser = (text: string) => {
      let i
      for (i = 0; text[i - 2] != '>'; i++) {} // 2 to deal with the space that comes afterward
      return text.slice(i)
    }

    const message = removeUser(props.event.text)
    switch (message) {
      case 'help':
        return await props.client.chat.postMessage({
          channel: props.event.channel,
          user: props.context.userId,
          blocks: views.helpDialog,
          thread_ts
        })
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

          return await props.client.chat.postMessage({
            channel: props.event.channel,
            blocks: await showInventory(user),
            thread_ts
          })
        } else if (message.startsWith('<@')) {
          const mentionId = message.slice(2, message.length - 1) // Remove the formatted ID
          const mention = await findOrCreateIdentity(mentionId)

          const name = (
            await props.client.users.info({
              user: mentionId
            })
          ).user.profile.display_name

          const user = await prisma.identity.findUnique({
            where: { slack: props.context.userId }
          })
          if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.READ_PRIVATE
          )
            mention.inventory = mention.inventory.filter(
              instance => instance.public
            )
          else if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.WRITE
          )
            mention.inventory = mention.inventory.filter(instance =>
              user.specificItems.find(item => item === instance.itemId)
            )

          return await props.client.chat.postMessage({
            channel: props.event.channel,
            blocks: await showInventory(mention, name),
            thread_ts
          })
        }
        await props.client.chat.postEphemeral({
          channel: props.event.channel,
          user: props.context.userId,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Try running `@bag me`, `@bag me private`, `@bag <mention someone>`!'
              }
            }
          ],
          thread_ts
        })
    }
  })
})

const showInventory = async (
  user: IdentityWithInventory,
  name?: string
): Promise<(Block | KnownBlock)[]> => {
  const formatInventory = async (inventory: Instance[]): Promise<string> => {
    let formatted: string[] = []
    for (let instance of inventory) {
      const item = await prisma.item.findUnique({
        where: {
          name: instance.itemId
        }
      })
      formatted.push(` x${instance.quantity} ${item.reaction} ${item.name}`)
    }
    if (formatted.length == 1) return formatted[0]
    formatted = formatted.sort((a, b) => {
      const aSplit = a.trim().split(' ')
      const bSplit = b.trim().split(' ')
      return aSplit.slice(1).join(' ').localeCompare(bSplit.slice(1).join(' '))
    })
    return (
      formatted.slice(0, formatted.length - 1).join(', ') +
      (formatted.length > 2 ? ',' : '') +
      ' and ' +
      formatted[formatted.length - 1]
    )
  }

  let text = []
  if (user.permissions === 'ADMIN')
    text.push(`${name ? `${name}` : `<@${user.slack}>`} is an admin and has:`)
  else text.push(`${name ? `${name}` : `<@${user.slack}>`} has:`)

  if (!user.inventory.length)
    text.push(
      ' nothing. Nothing? The bag is empty? Are you sure? Time to go out and do some stuff.'
    )
  else text.push(await formatInventory(user.inventory))

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: text.join('')
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: 'To get more info about an item try `/item <name>`!'
        }
      ]
    }
  ]
}
