import slack, { execute } from '../slack'
import views from '../views'
import { PrismaClient } from '@prisma/client'
import { findOrCreateIdentity } from '../../db'

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
    const thread_ts = props.body.event.thread_ts

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
          blocks: views.helpDialog,
          thread_ts
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
            blocks: await views.showInventory(user),
            thread_ts
          })

          break
        } else if (message.startsWith('<@')) {
          // Mentioning user
          const mentionId = message.slice(2, message.length - 1) // Remove the formatted ID
          const mention = await findOrCreateIdentity(mentionId)

          await props.client.chat.postMessage({
            channel: props.event.channel,
            blocks: await views.showInventory(mention),
            thread_ts
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
          ],
          thread_ts
        })
    }
  })
})
