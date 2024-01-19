import { findOrCreateIdentity, type IdentityWithInventory } from '../../db'
import slack, { execute } from '../slack'
import views from '../views'
import { PrismaClient, Instance } from '@prisma/client'
import { Block, KnownBlock } from '@slack/bolt'

const prisma = new PrismaClient()

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
        blocks: await showInventory(user)
      })
    }
    if (message.startsWith('<@')) {
      // Mentioning user
      const mentionId = message.slice(2, message.indexOf('|'))
      const mention = await findOrCreateIdentity(mentionId)

      return await props.respond({
        response_type: 'in_channel',
        blocks: await showInventory(mention)
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

          return await props.client.chat.postMessage({
            channel: props.event.channel,
            blocks: await showInventory(mention),
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
                text: "Sorry, can't help you with that, I'm just a measly bag, it's the stuff inside that's useful... maybe this is helpful? :point_down:"
              }
            },
            ...views.helpDialog
          ],
          thread_ts
        })
    }
  })
})

const showInventory = async (
  user: IdentityWithInventory,
  ts?: string
): Promise<(Block | KnownBlock)[]> => {
  const formatInventory = async (
    inventory: Instance[]
  ): Promise<(Block | KnownBlock)[]> => {
    let formatted: (Block | KnownBlock)[] = []
    for (let instance of inventory) {
      const item = await prisma.item.findUnique({
        where: { name: instance.itemId }
      })
      formatted.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `x${instance.quantity} ${item.reaction} ${item.name}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Info'
          },
          value: JSON.stringify(item),
          action_id: 'get-item'
        }
      })
    }
    return formatted
  }

  let text = []
  if (user.permissions === 'ADMIN')
    text.push(`<@${user.slack}> is an admin and has:`)
  else text.push(`<@${user.slack}> has:`)

  if (!user.inventory.length) {
    text.push(
      ' nothing. Nothing? The bag is empty? Are you sure? Time to go out and do some stuff.'
    )
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: text.join('')
        }
      }
    ]
  } else
    return [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: text.join('')
        }
      },
      ...(await formatInventory(user.inventory))
    ]
}
