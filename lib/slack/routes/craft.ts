import { prisma } from '../../db'
import { channelBlacklist, channels } from '../../utils'
import slack, { execute } from '../slack'
import views from '../views'
import type { View } from '@slack/bolt'

slack.command('/huh', async props => {
  return await execute(props, async props => {
    try {
      const conversation = await props.client.conversations.info({
        channel: props.body.channel_id
      })
      if (channelBlacklist.includes(conversation.channel.name))
        return await props.respond({
          response_type: 'ephemeral',
          text: `Crafting in this channel isn't allowed. Try running \`/craft\` in a public channel, like <#${channels.lounge}>!`
        })
      else if (conversation.channel.is_im || conversation.channel.is_mpim)
        return await props.respond({
          response_type: 'ephemeral',
          text: `Trading in DMs isn't allowed yet. Try running \`/trade\` in a public channel, like <#${channels.lounge}>!`
        })
    } catch {
      return await props.respond({
        response_type: 'ephemeral',
        text: `Trading in DMs isn't allowed yet. Try running \`/trade\` in a public channel, like <#${channels.lounge}>!`
      })
    }

    const { view } = await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: views.loadingDialog('Start crafting')
    })

    const updated = await startCrafting(
      props.context.userId,
      props.body.channel_id
    )

    await props.client.views.update({
      view_id: view.id,
      view: updated
    })
  })
})

const startCrafting = async (
  userId: string,
  channel: string
): Promise<View> => {
  // Inputs, outputs, and tools
  const user = await prisma.identity.findUnique({
    where: { slack: userId },
    include: { inventory: true }
  })

  let offering = []
  let inTrades = []
  let inCrafting = []

  await Promise.all(
    user.inventory.map(async instance => {
      let ref = await prisma.item.findUnique({
        where: { name: instance.itemId }
      })

      // First, search in trades
      const trades = await prisma.trade.findMany({
        where: {
          closed: false, // Not closed
          OR: [
            { initiatorTrades: { some: { instanceId: instance.id } } },
            { receiverTrades: { some: { instanceId: instance.id } } }
          ] // Either in initiatorTrades or receiverTrades
        },
        include: {
          initiatorTrades: true,
          receiverTrades: true
        }
      })
      let offers = trades
        .map(offer => ({
          ...offer,
          trades: [...offer.initiatorTrades, ...offer.receiverTrades]
        }))
        .filter(offer =>
          offer.trades.find(trade => trade.instanceId === instance.id)
        )

      for (let offer of offers)
        inTrades.push(
          `x${
            offer.trades.find(trade => trade.instanceId === instance.id)
              .quantity
          } ${ref.reaction} ${ref.name} in trade with <@${
            offer.initiatorIdentityId === userId
              ? offer.receiverIdentityId
              : offer.initiatorIdentityId
          }>`
        )

      // Next, search in crafting
    })
  )

  let view: View = {
    callback_id: 'start-crafting',
    title: {
      type: 'plain_text',
      text: 'Start crafting'
    },
    submit: {
      type: 'plain_text',
      text: 'Start crafting'
    },
    type: 'modal',
    private_metadata: JSON.stringify({ channel }),
    blocks: []
  }

  if (inTrades.length)
    view.blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "Items you own that you're currently offering in other trades:"
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: inTrades.join('\n')
        }
      }
    )

  return view
}
