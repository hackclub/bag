import { log } from '../../analytics'
import { findOrCreateIdentity } from '../../db'
import { prisma } from '../../db'
import { userRegex } from '../../utils'
import slack, { execute } from '../slack'
import views from '../views'
import type { View } from '@slack/bolt'

slack.command('/give', async props => {
  await execute(props, async props => {
    const logId = `${props.context.userId}-${Date.now()}`
    await log('slack-give', `${logId}`, {
      channel: props.body.channel_id,
      giver: (await props.client.users.info({ user: props.context.userId }))
        .user.profile.display_name
    })

    const message = props.command.text.trim()
    const receiverId = message.slice(2, message.indexOf('|'))
    const regex = new RegExp(userRegex)
    const passes = regex.test(message)
    if (passes === false) {
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: 'To give someone something, run `/give @<person>`!'
      })
    } else if (props.context.userId == receiverId)
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: "Erm, you can't really give yourself something..."
      })

    const { view } = await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: views.loadingDialog('Give from inventory')
    })

    const user = await prisma.identity.findUnique({
      where: { slack: props.context.userId },
      include: { inventory: true }
    })
    if (!user.inventory.length)
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: "Looks like you don't have any items to give yet."
      })

    const receiver = await findOrCreateIdentity(receiverId)

    // Update analytics with receiver
    console.log(
      await log(
        'slack-give',
        logId,
        {
          receiver: (await props.client.users.info({ user: receiver.slack }))
            .user.profile.display_name
        },
        true
      )
    )

    await props.client.views.update({
      view_id: view.id,
      view: await giveDialog(
        props.context.userId,
        receiver.slack,
        props.body.channel_id
      )
    })
  })
})

slack.view('give', async props => {
  await execute(props, async props => {
    let fields: {
      instance: any
      quantity: number
      note: string
    } = {
      instance: undefined,
      quantity: 1,
      note: undefined
    }
    for (let field of Object.values(props.view.state.values))
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]]?.value ||
        Object.values(field)[0].selected_option?.value ||
        ''
    fields.instance = JSON.parse(fields.instance)
    fields.quantity = Number(fields.quantity)

    const { receiverId, channel } = JSON.parse(props.view.private_metadata)

    const giver = await prisma.identity.findUnique({
      where: { slack: props.context.userId },
      include: { inventory: true }
    })
    const instance = giver.inventory.find(
      instance => instance.id === fields.instance.id
    )
    const ref = await prisma.item.findUnique({
      where: { name: instance.itemId }
    })

    if (fields.quantity > fields.instance.quantity)
      return props.client.chat.postEphemeral({
        channel,
        user: props.context.userId,
        text: `Woah woah woah! It doesn't look like you have ${fields.quantity} ${ref.reaction} ${ref.name} to give away.`
      })

    const receiver = await prisma.identity.findUnique({
      where: { slack: receiverId },
      include: { inventory: true }
    })
    let transfer
    const existing = receiver.inventory.find(
      instance => instance.itemId === ref.name
    )
    if (existing !== undefined) {
      transfer = await prisma.instance.update({
        where: {
          id: existing.id
        },
        data: {
          quantity: existing.quantity + Math.max(fields.quantity, 1),
          metadata: instance.metadata
            ? {
                ...(existing.metadata as object),
                ...(instance.metadata as object)
              }
            : existing.metadata
        },
        include: {
          item: true
        }
      })
    } else {
      const transferData = Object.assign({}, instance)
      delete transferData.id
      transfer = await prisma.instance.create({
        data: {
          ...transferData,
          identityId: receiver.slack,
          quantity: fields.quantity
        }
      })
    }

    let updated = await prisma.instance.update({
      where: {
        id: instance.id
      },
      data: {
        // Adjust quantity
        quantity: instance.quantity - fields.quantity
      }
    })
    if (!updated.quantity) {
      // Detach user from instance
      await prisma.instance.update({
        where: {
          id: instance.id
        },
        data: {
          identity: { disconnect: true }
        }
      })
    }

    // Leave note for receiver
    await props.client.chat.postMessage({
      channel: receiver.slack,
      user: receiver.slack,
      text: `<@${giver.slack}> just gave you x${fields.quantity} ${
        ref.reaction
      } *${ref.name}*! It's in your inventory now.${
        fields.note ? '\n\n>' + fields.note : ''
      }`
    })
  })
})

const giveDialog = async (
  giverId: string,
  receiverId: string,
  channel: string
): Promise<View> => {
  const giver = await prisma.identity.findUnique({
    where: { slack: giverId },
    include: { inventory: true }
  })

  let offers = []
  let notOffering = []
  for (let instance of giver.inventory) {
    const trades = await prisma.trade.findMany({
      where: {
        closed: false,
        OR: [
          { initiatorTrades: { some: { instanceId: instance.id } } },
          { receiverTrades: { some: { instanceId: instance.id } } }
        ]
      },
      include: {
        initiatorTrades: true,
        receiverTrades: true
      }
    })
    const item = await prisma.item.findUnique({
      where: { name: instance.itemId }
    })
    const otherOffers = trades
      .map(offer => ({
        ...offer,
        trades: [...offer.initiatorTrades, ...offer.receiverTrades]
      }))
      .filter(offer =>
        offer.trades.find(trade => trade.instanceId === instance.id)
      )
    const quantityLeft = otherOffers.reduce((acc, curr) => {
      return (
        acc -
        curr.trades.find(trade => trade.instanceId === instance.id).quantity
      )
    }, instance.quantity)
    if (quantityLeft)
      offers.push({
        text: {
          type: 'plain_text',
          text: `x${quantityLeft} ${item.reaction} ${instance.itemId}`,
          emoji: true
        },
        value: JSON.stringify({
          id: instance.id,
          quantity: quantityLeft
        })
      })
    for (let offer of otherOffers) {
      notOffering.push(
        `x${
          offer.trades.find(trade => trade.instanceId === instance.id).quantity
        } ${item.reaction} ${item.name} in trade with <@${
          offer.initiatorIdentityId === giver.slack
            ? offer.receiverIdentityId
            : offer.initiatorIdentityId
        }>`
      )
    }
  }

  let view: View = {
    callback_id: 'give',
    title: {
      type: 'plain_text',
      text: 'Give from inventory'
    },
    submit: {
      type: 'plain_text',
      text: 'Give'
    },
    type: 'modal',
    private_metadata: JSON.stringify({ receiverId, channel }),
    blocks: [
      {
        type: 'input',
        element: {
          action_id: 'instance',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Choose a item'
          },
          options: offers
        },
        label: {
          type: 'plain_text',
          text: 'Item to give'
        }
      },
      {
        type: 'input',
        element: {
          type: 'number_input',
          is_decimal_allowed: false,
          action_id: 'quantity',
          min_value: '1',
          initial_value: '1'
        },
        label: {
          type: 'plain_text',
          text: 'Quantity'
        }
      },
      {
        type: 'input',
        optional: true,
        element: {
          type: 'plain_text_input',
          multiline: true,
          action_id: 'note',
          placeholder: {
            type: 'plain_text',
            text: 'Leave a little note!'
          }
        },
        label: {
          type: 'plain_text',
          text: 'Note'
        }
      }
    ]
  }
  if (notOffering.length)
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
          text: notOffering.join('\n')
        }
      }
    )

  return view
}
