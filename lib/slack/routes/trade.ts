import { log } from '../../analytics'
import { web } from '../../api/routing'
import { TradeWithTrades, findOrCreateIdentity } from '../../db'
import { prisma } from '../../db'
import { mappedPermissionValues } from '../../permissions'
import { channelBlacklist, userRegex, channels } from '../../utils'
import slack, { execute } from '../slack'
import views from '../views'
import { Block, BlockElementAction, Button, ButtonAction, KnownBlock, View } from '@slack/bolt'
import { exec } from 'child_process'

slack.command(`/${process.env.SLASH_COMMAND_PREFIX}trade`, async props => {
  await execute(props, async props => {
    await log('slack-trade', `${props.context.userId}-${Date.now()}`, {
      channel: props.body.channel_id,
      user: (await props.client.users.info({ user: props.context.userId })).user
        .profile.display_name,
      command: `/trade ${props.command.text}`
    })

    try {
      const conversation = await props.client.conversations.info({
        channel: props.body.channel_id
      })
      if (channelBlacklist.includes(conversation.channel.name))
        return await props.respond({
          response_type: 'ephemeral',
          text: `Trading in this channel isn't allowed. Try running \`/trade\` in a public channel, like <#${channels.lounge}>!`
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

    const message = props.command.text.trim()
    const regex = new RegExp(userRegex)
    const passes = regex.test(message)
    if (passes === false) {
      return await props.respond({
        response_type: 'ephemeral',
        text: 'To start a trade, run `/trade @<person>`!'
      })
    } else if (props.context.userId == message.slice(2, message.indexOf('|')))
      return await props.respond({
        response_type: 'ephemeral',
        text: "Erm, you can't really trade with yourself..."
      })

    const receiverId = message.slice(2, message.indexOf('|'))

    const user = await prisma.identity.findUnique({
      where: { slack: props.context.userId },
      include: { inventory: true }
    })
    if (!user.inventory.length)
      return await props.respond({
        response_type: 'ephemeral',
        text: "Looks like you don't have any items to trade yet."
      })

    const receiver = await findOrCreateIdentity(receiverId)
    if (!receiver.inventory.length)
      return await props.respond({
        response_type: 'ephemeral',
        text: `<@${receiver.slack}> doesn't have any items to trade yet! Perhaps you meant to run \`/give\` to give them a item.`
      })

    if (
      await prisma.trade.findFirst({
        where: {
          OR: [
            {
              initiatorIdentityId: props.context.userId,
              receiverIdentityId: receiver.slack,
              closed: false
            },
            {
              initiatorIdentityId: receiver.slack,
              receiverIdentityId: props.context.userId,
              closed: false
            }
          ]
        }
      })
    )
      return await props.respond({
        response_type: 'ephemeral',
        text: `You're already in an open trade with <@${receiver.slack}>.`
      })

    // Initiator should first select an item
    const { view } = await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: views.loadingDialog('Start trade')
    })

    const updated = await startTrade(
      user.slack,
      receiver.slack,
      props.body.channel_id
    )
    await props.client.views.update({
      view_id: view.id,
      view: updated
    })
  })
})

slack.view('start-trade', async props => {
  await execute(props, async props => {
    let fields: {
      instance: any
      quantity: number
    } = {
      instance: undefined,
      quantity: 1
    }
    for (let field of Object.values(props.view.state.values))
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]]?.value ||
        Object.values(field)[0].selected_option?.value ||
        ''
    fields.instance = JSON.parse(fields.instance)
    fields.quantity = Number(fields.quantity)

    const { receiverId, channel: openChannel } = JSON.parse(
      props.view.private_metadata
    )

    if (fields.quantity > fields.instance.quantity) {
      const instance = await prisma.instance.findUnique({
        where: { id: fields.instance.id },
        include: { item: true }
      })
      return await props.client.chat.postEphemeral({
        channel: openChannel,
        user: props.body.user.id,
        text: `Woah woah woah! It doesn't look like you have ${fields.quantity} ${instance.item.reaction} ${instance.item.name} to trade. You could possibly be using ${instance.item.reaction} ${instance.item.name} somewhere else.`
      })
    }

    const tradeInstance = await prisma.tradeInstance.create({
      data: {
        instance: { connect: { id: Number(fields.instance.id) } },
        quantity: Number(fields.quantity)
      }
    })

    const trade = await prisma.trade.create({
      data: {
        initiatorIdentityId: props.context.userId,
        receiverIdentityId: receiverId,
        initiatorTrades: { connect: tradeInstance }
      }
    })

    // ! This is what prevents this from working in DMs
    const { channel, ts } = await props.client.chat.postMessage({
      channel: openChannel,
      blocks: await showTrade(props.context.userId, receiverId, trade.id)
    })

    await props.client.chat.update({
      channel,
      ts,
      blocks: await showTrade(props.context.userId, receiverId, trade.id, {
        channel,
        ts
      })
    })
  })
})

slack.action('edit-offer', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { tradeId, channel, ts } = JSON.parse(props.action.value)

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    })
    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! You're not a party to that trade."
      })
    else if (trade.closed || trade.initiatorAgreed || trade.receiverAgreed)
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! Trade already confirmed, you can't make any more edits."
      })

    // @ts-expect-error
    const { view } = await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.body.trigger_id,
      view: views.loadingDialog('Edit trade')
    })

    // @ts-expect-error
    await props.client.views.update({
      view_id: view.id,
      view: await tradeDialog(props.body.user.id, tradeId, { channel, ts })
    })
  })
})

slack.action('decline-trade', async props => {
  await execute(props, async props => {
    // Close trade
    // @ts-expect-error
    const { tradeId, channel, ts } = JSON.parse(props.action.value)
    let trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    })

    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! You're not a party to that trade."
      })

    trade = await prisma.trade.update({
      where: {
        id: tradeId
      },
      data: {
        closed: true
      }
    })

    // @ts-expect-error
    await props.client.chat.update({
      channel,
      ts,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `<@${props.body.user.id}> declined to trade with <@${
              props.body.user.id === trade.initiatorIdentityId
                ? trade.receiverIdentityId
                : trade.initiatorIdentityId
            }>.`
          }
        }
      ]
    })
  })
})

slack.action('accept-trade', async props => {
  await execute(props, async props => {
    // Close trade, transfer items between users
    // @ts-expect-error
    let { tradeId, channel, ts } = JSON.parse(props.action.value)
    let trade = await prisma.trade.findUnique({
      where: { id: Number(tradeId) }
    })

    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! You're not a party to that trade."
      })

    const tradeKey =
      props.body.user.id === trade.initiatorIdentityId
        ? 'initiatorAgreed'
        : 'receiverAgreed'
    trade = await prisma.trade.update({
      where: {
        id: tradeId
      },
      data: {
        [tradeKey]: true
      }
    })

    // Make sure both sides have agreed
    if (!trade.initiatorAgreed || !trade.receiverAgreed) {
      await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: `Cool! Waiting for <@${
          props.body.user.id === trade.initiatorIdentityId
            ? trade.receiverIdentityId
            : trade.initiatorIdentityId
        }> to confirm.`
      })
      try {
        // @ts-expect-error
        await props.client.chat.postEphemeral({
          channel,
          ts,
          user:
            props.body.user.id === trade.initiatorIdentityId
              ? trade.receiverIdentityId
              : trade.initiatorIdentityId,
          text: `<@${props.body.user.id}> just confirmed the trade and is waiting for you to confirm or decline.`
        })
      } catch {}
      // @ts-expect-error
      return await props.client.chat.update({
        channel,
        ts,
        blocks: await showTrade(
          trade.initiatorIdentityId,
          trade.receiverIdentityId,
          trade.id,
          { channel, ts }
        )
      })
    }

    // If both sides have agreed, close the trade
    const closed = await prisma.trade.update({
      where: { id: tradeId },
      data: { closed: true },
      include: { initiatorTrades: true, receiverTrades: true }
    })

    let initiator = await prisma.identity.findUnique({
      where: { slack: trade.initiatorIdentityId },
      include: { inventory: true }
    })
    let receiver = await prisma.identity.findUnique({
      where: { slack: trade.receiverIdentityId },
      include: { inventory: true }
    })

    // @ts-expect-error
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showTrade(
        initiator.slack,
        receiver.slack,
        trade.id,
        { channel, ts },
        true
      )
    })

    // Now transfer items
    for (let offer of closed.initiatorTrades) {
      const instance = await prisma.instance.findUnique({
        where: { id: offer.instanceId }
      })
      if (offer.quantity < instance.quantity) {
        // Subtract from quantity
        await prisma.instance.update({
          where: { id: instance.id },
          data: { quantity: instance.quantity - offer.quantity }
        })

        const existing = receiver.inventory.find(
          receiverInstance => receiverInstance.itemId === instance.itemId
        )
        if (existing !== undefined) {
          // Add to existing instance
          await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + offer.quantity,
              metadata: instance.metadata
                ? {
                    ...(existing.metadata as object),
                    ...(instance.metadata as object)
                  }
                : existing.metadata
            }
          })
        } else
          await prisma.instance.create({
            data: {
              itemId: instance.itemId,
              identityId: receiver.slack,
              quantity: offer.quantity,
              public: instance.public
            }
          })
      } else {
        // Transfer entire instance over
        const existing = receiver.inventory.find(
          receiverInstance => receiverInstance.itemId === instance.itemId
        )
        if (existing !== undefined) {
          // Add to existing instance
          await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + offer.quantity,
              metadata: instance.metadata
                ? {
                    ...(existing.metadata as object),
                    ...(instance.metadata as object)
                  }
                : existing.metadata
            }
          })
          await prisma.instance.update({
            where: { id: instance.id },
            data: {
              identity: { disconnect: true }
            }
          })
        } else
          await prisma.instance.update({
            where: { id: instance.id },
            data: { identityId: receiver.slack }
          })
      }
    }

    initiator = await prisma.identity.findUnique({
      where: { slack: trade.initiatorIdentityId },
      include: { inventory: true }
    })
    receiver = await prisma.identity.findUnique({
      where: { slack: trade.receiverIdentityId },
      include: { inventory: true }
    })

    for (let offer of closed.receiverTrades) {
      const instance = await prisma.instance.findUnique({
        where: { id: offer.instanceId }
      })
      if (offer.quantity < instance.quantity) {
        await prisma.instance.update({
          where: { id: instance.id },
          data: { quantity: instance.quantity - offer.quantity }
        })

        const existing = initiator.inventory.find(
          initiatorInstance => initiatorInstance.itemId === instance.itemId
        )
        if (existing !== undefined) {
          // Add to existing instance
          await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + offer.quantity,
              metadata: instance.metadata
                ? {
                    ...(existing.metadata as object),
                    ...(instance.metadata as object)
                  }
                : existing.metadata
            }
          })
        } else
          await prisma.instance.create({
            data: {
              itemId: instance.itemId,
              identityId: initiator.slack,
              quantity: offer.quantity,
              public: instance.public
            }
          })
      } else {
        // Transfer entire instance over
        const existing = initiator.inventory.find(
          receiverInstance => receiverInstance.itemId === instance.itemId
        )
        if (existing !== undefined) {
          // Add to existing instance
          await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + offer.quantity,
              metadata: instance.metadata
                ? {
                    ...(existing.metadata as object),
                    ...(instance.metadata as object)
                  }
                : existing.metadata
            }
          })
          await prisma.instance.update({
            where: { id: instance.id },
            data: {
              identity: { disconnect: true }
            }
          })
          receiver.inventory = receiver.inventory.filter(
            old => !(old.id === instance.id)
          )
        } else
          await prisma.instance.update({
            where: { id: instance.id },
            data: { identityId: initiator.slack }
          })
      }
    }
  })
})

slack.action('accept-trade', async props => {
  await execute(props, async props => {
    // Close trade, transfer items between users
    // @ts-expect-error
    let { tradeId, channel, ts } = JSON.parse(props.action.value)
    let trade = await prisma.trade.findUnique({
      where: { id: Number(tradeId) }
    })

    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        props.body.user.id
      )
    )
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! You're not a party to that trade."
      })

    const tradeKey =
      props.body.user.id === trade.initiatorIdentityId
        ? 'initiatorAgreed'
        : 'receiverAgreed'
    trade = await prisma.trade.update({
      where: { id: tradeId },
      data: {
        [tradeKey]: true
      }
    })

    // Make sure both sides have agreed
    if (!trade.initiatorAgreed || !trade.receiverAgreed) {
      await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: `Cool! Waiting for <@${
          props.body.user.id === trade.initiatorIdentityId
            ? trade.receiverIdentityId
            : trade.initiatorIdentityId
        }> to confirm.`
      })
      try {
        // @ts-expect-error
        await props.client.chat.postEphemeral({
          channel,
          ts,
          user:
            props.body.user.id === trade.initiatorIdentityId
              ? trade.receiverIdentityId
              : trade.initiatorIdentityId,
          text: `<@${props.body.user.id}> just confirmed the trade and is waiting for you to confirm or decline.`
        })
      } catch {}
      // @ts-expect-error
      return await props.client.chat.update({
        channel,
        ts,
        blocks: await showTrade(
          trade.initiatorIdentityId,
          trade.receiverIdentityId,
          trade.id,
          { channel, ts }
        )
      })
    }

    // If both sides have agreed, close the trade
    const closed = await prisma.trade.update({
      where: { id: tradeId },
      data: { closed: true },
      include: { initiatorTrades: true, receiverTrades: true }
    })

    let initiator = await prisma.identity.findUnique({
      where: { slack: trade.initiatorIdentityId },
      include: { inventory: true }
    })
    let receiver = await prisma.identity.findUnique({
      where: { slack: trade.receiverIdentityId },
      include: { inventory: true }
    })

    // @ts-expect-error
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showTrade(
        initiator.slack,
        receiver.slack,
        trade.id,
        { channel, ts },
        true
      )
    })
  })
})

slack.action('remove-trade', async props => {
  return await execute(props, async props => {
    // Remove from the trade
    const { tradeInstanceId, tradeId, channel, ts } = JSON.parse(
      // @ts-expect-error
      props.action.value
    )
    const trade = await prisma.trade.findUnique({
      where: {
        id: tradeId
      }
    })

    if (trade.closed || trade.initiatorAgreed || trade.receiverAgreed) {
      // Close modal
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! Trade already confirmed, you can't make any more edits."
      })
    }

    await prisma.tradeInstance.delete({
      where: {
        id: tradeInstanceId
      }
    })

    // @ts-expect-error
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showTrade(
        trade.initiatorIdentityId,
        trade.receiverIdentityId,
        tradeId,
        { channel, ts }
      )
    })

    // @ts-expect-error
    await props.client.views.update({
      external_id: `${props.body.user.id}-${tradeId}`,
      view: await tradeDialog(props.body.user.id, tradeId, { channel, ts })
    })
  })
})

slack.view('add-trade', async props => {
  await execute(props, async props => {
    const user = await prisma.identity.findUnique({
      where: { slack: props.body.user.id },
      include: { inventory: true }
    })

    let fields: {
      instance: any
      quantity: number
    } = {
      instance: undefined,
      quantity: 1
    }
    for (let field of Object.values(props.view.state.values))
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]]?.value ||
        Object.values(field)[0].selected_option?.value ||
        ''
    fields.instance = JSON.parse(fields.instance)
    fields.quantity = Number(fields.quantity)

    const { tradeId, channel, ts } = JSON.parse(props.view.private_metadata)

    if (fields.quantity > fields.instance.quantity) {
      const instance = await prisma.instance.findUnique({
        where: { id: fields.instance.id },
        include: { item: true }
      })
      return await props.client.chat.postEphemeral({
        channel,
        user: props.body.user.id,
        text: `Woah woah woah! It doesn't look like you have ${fields.quantity} ${instance.item.reaction} ${instance.item.name} to trade. You could possibly be using ${instance.item.reaction} ${instance.item.name} somewhere else.`
      })
    }

    const instance = user.inventory.find(
      instance => instance.id === fields.instance.id
    )
    const ref = await prisma.item.findUnique({
      where: {
        name: instance.itemId
      }
    })

    // Add to trade by creating instance
    const trade = await prisma.trade.findUnique({
      where: { id: tradeId }
    })
    const tradeKey =
      user.slack === trade.initiatorIdentityId
        ? 'initiatorTrades'
        : 'receiverTrades'

    await prisma.tradeInstance.create({
      data: {
        instanceId: instance.id,
        quantity: fields.quantity,
        [tradeKey]: { connect: trade }
      }
    })

    // Update thread
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showTrade(
        trade.initiatorIdentityId,
        trade.receiverIdentityId,
        trade.id,
        { channel, ts }
      )
    })
  })
})

// Bot routes
slack.action('bot-decline-trade', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { req, id, thread } = JSON.parse(props.action.value)

    await props.say('Trade declined.')

    // @ts-expect-error
    await props.client.chat.delete({
      ...thread
    })

    if (req.callbackUrl)
      await fetch(req.callbackUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Trade declined' })
      })
  })
})

slack.action('bot-decline-update-trade', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { req, id } = JSON.parse(props.action.value)

    if (req.callbackUrl)
      await fetch(req.callbackUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Trade update declined' })
      })
  })
})

slack.action('bot-create-trade', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { req, id } = JSON.parse(props.action.value)

    // Search for a trade first
    let trade = await prisma.trade.findFirst({
      where: {
        initiatorIdentityId: req.initator,
        receiverIdentityId: req.receiver,
        approved: false
      }
    })

    await props.respond('Awesome!')
    if (trade) {
      // Already exists - approve trade!
      await prisma.trade.update({
        where: { id: trade.id },
        data: {
          approved: true
        }
      })
    } else {
      return await prisma.trade.create({
        data: {
          initiatorIdentityId: req.initiator,
          receiverIdentityId: req.receiver,
          public: req.public ? req.public : false,
          approved: false
        }
      })
    }

    const app = await prisma.app.findUnique({
      where: { id }
    })

    if (
      mappedPermissionValues[app.permissions] <=
      mappedPermissionValues.WRITE_SPECIFIC
    )
      await prisma.app.update({
        where: { id: app.id },
        data: { specificTrades: { push: trade.id } }
      })

    if (req.callbackUrl) {
      try {
        await fetch(req.callbackUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            trade,
            metadata: req.callbackMetadata ? req.callbackMetadata : undefined
          })
        })
      } catch {}
    }
  })
})

slack.action('bot-close-trade', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { req, id } = JSON.parse(props.action.value)

    const app = await prisma.app.findUnique({
      where: { id }
    })

    let trade: TradeWithTrades = await prisma.trade.findUnique({
      where: { id: req.tradeId },
      include: { initiatorTrades: true, receiverTrades: true }
    })
    if (
      mappedPermissionValues[app.permissions] <=
        mappedPermissionValues.WRITE_SPECIFIC &&
      !app.specificTrades.find(tradeId => tradeId === trade.id)
    ) {
      if (req.callbackUrl) {
        // Throw error to callbackUrl
        try {
          await fetch(req.callbackUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Trade not found' })
          })
        } catch {}
      }
      return
    }

    // Make sure both sides have approved
    trade = await prisma.trade.update({
      where: { id: trade.id },
      data: {
        [props.body.user.id === trade.initiatorIdentityId
          ? 'initiatorAgreed'
          : 'receiverAgreed']: true
      },
      include: { initiatorTrades: true, receiverTrades: true }
    })

    if (!trade.initiatorAgreed || !trade.receiverAgreed)
      return await props.respond(
        'Awesome! Waiting for the other side to accept.'
      )

    // Transfer betweeen users
    const initiator = await prisma.identity.findUnique({
      where: { slack: trade.initiatorIdentityId },
      include: { inventory: true }
    })
    const receiver = await prisma.identity.findUnique({
      where: { slack: trade.receiverIdentityId },
      include: { inventory: true }
    })

    let initiatorTrades = []
    let receiverTrades = []

    await Promise.all(
      trade.initiatorTrades.map(async trade => {
        const instance = await prisma.instance.findUnique({
          where: { id: trade.instanceId },
          include: { item: true }
        })
        initiatorTrades.push(
          `x${trade.quantity} ${instance.item.reaction} ${instance.item.name}`
        )
        if (trade.quantity < instance.quantity) {
          await prisma.instance.update({
            where: { id: instance.id },
            data: { quantity: instance.quantity - trade.quantity }
          })
          const receiverInstance = receiver.inventory.find(
            receiverInstance => receiverInstance.itemId === instance.itemId
          )
          if (receiverInstance)
            await prisma.instance.update({
              where: { id: receiverInstance.id },
              data: {
                quantity: trade.quantity + receiverInstance.quantity
              }
            })
          else
            await prisma.instance.create({
              data: {
                itemId: instance.itemId,
                identityId: receiver.slack,
                quantity: trade.quantity,
                public: instance.public
              }
            })
        }
        // Transfer entire instance over
        else
          await prisma.instance.update({
            where: { id: instance.id },
            data: { identityId: receiver.slack }
          })
      })
    )
    await Promise.all(
      trade.receiverTrades.map(async trade => {
        const instance = await prisma.instance.findUnique({
          where: { id: trade.instanceId },
          include: { item: true }
        })
        receiverTrades.push(
          `x${trade.quantity} ${instance.item.reaction} ${instance.item.name}`
        )
        if (trade.quantity < instance.quantity) {
          await prisma.instance.update({
            where: { id: instance.id },
            data: { quantity: instance.quantity - trade.quantity }
          })
          const initiatorInstance = initiator.inventory.find(
            initiatorInstance => initiatorInstance.itemId === instance.itemId
          )
          if (initiatorInstance)
            await prisma.instance.update({
              where: { id: initiatorInstance.id },
              data: {
                quantity: trade.quantity + initiatorInstance.quantity
              }
            })
          else
            await prisma.instance.create({
              data: {
                itemId: instance.itemId,
                identityId: initiator.slack,
                quantity: trade.quantity,
                public: instance.public
              }
            })
        }
        // Transfer entire instance over
        else
          await prisma.instance.update({
            where: { id: instance.id },
            data: { identityId: initiator.slack }
          })
      })
    )

    let closed = await prisma.trade.update({
      where: { id: req.tradeId },
      data: { closed: true },
      include: { initiatorTrades: true, receiverTrades: true }
    })

    const yourTrades =
      props.body.user.id === trade.initiatorIdentityId
        ? initiatorTrades
        : receiverTrades
    const theirTrades =
      props.body.user.id === trade.receiverIdentityId
        ? receiverTrades
        : initiatorTrades
    await props.respond(
      `Trade closed between you and ${
        props.body.user.id === trade.initiatorIdentityId
          ? trade.receiverIdentityId
          : trade.initiatorIdentityId
      }. Here's what you traded:\n\n${
        yourTrades.length ? yourTrades.join('\n') : '_Nothing._'
      }Here's what ${
        props.body.user.id === trade.initiatorIdentityId
          ? trade.receiverIdentityId
          : trade.initiatorIdentityId
      } traded:\n\n${
        theirTrades.length ? theirTrades.join('\n') : '_Nothing._'
      }`
    )

    if (req.callbackUrl)
      return await fetch(req.callbackUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trade: closed,
          initiator,
          receiver,
          metadata: req.callbackMetadata ? req.callbackMetadata : undefined
        })
      })
  })
})

slack.action('bot-decline-close-trade', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { req, id } = await JSON.parse(props.action.value)

    const trade = await prisma.trade.update({
      where: {
        id: req.tradeId
      },
      data: {
        closed: true
      }
    })

    if (req.callbackUrl)
      await fetch(req.callbackUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Trade declined' })
      })
  })
})

slack.action('bot-update-trade', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { req, id } = JSON.parse(props.action.value)

    const app = await prisma.app.findUnique({
      where: { id }
    })

    if (
      mappedPermissionValues[app.permissions] <=
        mappedPermissionValues.WRITE_SPECIFIC &&
      !app.specificTrades.find(tradeId => tradeId === req.tradeId)
    )
      throw new Error('Trade not found')

    let trade = await prisma.trade.findUnique({
      where: { id: req.tradeId },
      include: {
        initiatorTrades: true,
        receiverTrades: true
      }
    })
    if (!trade) {
      if (req.callbackUrl)
        await fetch(req.callbackUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Trade not found' })
        })
      return
    }
    if (
      ![trade.initiatorIdentityId, trade.receiverIdentityId].includes(
        req.identityId
      )
    ) {
      if (req.callbackUrl)
        await fetch(req.callbackUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Identity not allowed to edit trade' })
        })
      return
    }

    const updateKey =
      trade.initiatorIdentityId === req.identityId
        ? 'initiatorTrades'
        : 'receiverTrades'

    // Add to trades, merging with ones that have already been added
    const crafting = await prisma.crafting.findFirst({
      where: {
        identityId: req.identityId,
        recipeId: null
      },
      include: { inputs: true }
    })

    let additions = []
    let removals = []

    for (let instance of req.add) {
      const search = trade[updateKey].find(
        add => add.instanceId === instance.id
      )
      const ref = await prisma.instance.findUnique({
        where: { id: instance.id },
        include: { item: true }
      })

      let quantityLeft = ref.quantity - instance.quantity

      // Deduct from crafting
      if (crafting) {
        const inCrafting = crafting.inputs.find(
          input => input.instanceId === instance.id
        )
        if (inCrafting) quantityLeft -= inCrafting.quantity
      }

      // Deduct from other trades
      const otherTrades = await prisma.trade.findMany({
        where: {
          closed: false, // Not closed
          OR: [
            {
              initiatorIdentityId: req.identityId,
              initiatorTrades: { some: { instanceId: instance.id } }
            },
            {
              receiverIdentityId: req.identityId,
              receiverTrades: { some: { instanceId: instance.id } }
            }
          ],
          NOT: [{ id: req.tradeId }]
        },
        include: {
          initiatorTrades: true,
          receiverTrades: true
        }
      })
      otherTrades
        .map(offer => ({
          ...offer,
          trades: [...offer.initiatorTrades, ...offer.receiverTrades]
        }))
        .filter(offer =>
          offer.trades.find(trade => trade.instanceId === instance.id)
        )
        .reduce((acc, curr) => {
          return (
            acc -
            curr.trades.find(trade => trade.instanceId === instance.id).quantity
          )
        }, quantityLeft)

      if (quantityLeft >= 0) {
        additions.push(
          `x${instance.quantity} ${ref.item.reaction} ${ref.item.name}`
        )
        if (search)
          await prisma.tradeInstance.update({
            where: { id: search.id },
            data: { quantity: search.quantity + instance.quantity }
          })
        else
          await prisma.tradeInstance.create({
            data: {
              instanceId: instance.id,
              quantity: instance.quantity,
              [updateKey]: {
                connect: await prisma.trade.findUnique({
                  where: { id: req.tradeId }
                })
              }
            }
          })
      } else {
        if (req.callbackUrl)
          await fetch(req.callbackUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              error: `Not enough ${ref.item.name} to add to trade`
            })
          })
        return
      }
    }

    trade = await prisma.trade.findUnique({
      where: { id: req.tradeId },
      include: {
        initiatorTrades: true,
        receiverTrades: true
      }
    })
    for (let instance of req.remove) {
      // Remove from trade
      const search = trade[updateKey].find(
        add => add.instanceId === instance.id
      )
      const ref = await prisma.instance.findUnique({
        where: { id: instance.id },
        include: { item: true }
      })
      removals.push(
        `x${instance.quantity} ${ref.item.reaction} ${ref.item.name}`
      )
      if (instance.quantity < search.quantity) {
        // Deduct from existing tradeInstance
        await prisma.tradeInstance.update({
          where: { id: search.id },
          data: { quantity: search.quantity - instance.quantity }
        })
      }
      // Completely remove trade
      else
        await prisma.tradeInstance.delete({
          where: { id: search.id }
        })
    }

    await props.say(
      `Approved ${
        app.name
      }'s request to add and remove the following from your trade with <@${
        props.body.user.id === trade.initiatorIdentityId
          ? trade.receiverIdentityId
          : trade.initiatorIdentityId
      }>:\n\nAdditions: ${
        additions.length ? '\n' + additions.join('\n') : '_Nothing._'
      }\n\nRemovals: ${
        removals.length ? '\n' + removals.join('\n') : '_Nothing._'
      }`
    )

    if (req.callbackUrl)
      return await fetch(req.callbackUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trade: await prisma.trade.findUnique({
            where: { id: req.tradeId },
            include: { initiatorTrades: true, receiverTrades: true }
          }),
          metadata: req.callbackMetadata ? req.callbackMetadata : undefined
        })
      })
  })
})

slack.action('accept-offer', async props => {
  await execute(props, async props => {
    const offerIdStr: string = (props.action as ButtonAction).value; // we know that this event only comes from a button
    let offerId: number;
    try {
      offerId = parseInt(offerIdStr);
    } catch (error) {
      return await props.respond({
        replace_original: false,
        text: 'Invalid offer ID (this is a bug in Bag, go yell at @fed about this)'
      })
    }
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        instancesToGive: {
          include: {
            instance: true
          }
        },
        instancesToReceive: {
          include: {
            instance: true
          }
        }
      }
    })
    if (!offer) {
      return await props.respond({
        replace_original: false,
        text: 'Offer not found. This is probably a bug in Bag, go yell at @fed about this.'
      })
    }
    // re-verify that the items exist in both inventories
    const sourceIdentity = await prisma.identity.findUnique({
      where: { slack: offer.sourceIdentityId },
      include: { inventory: true }
    })
    const receiverIdentity = await prisma.identity.findUnique({
      where: { slack: offer.targetIdentityId },
      include: { inventory: true }
    })
    console.log(`Checking that source ${sourceIdentity.slack} has all items (expecting ${offer.instancesToGive.length}) and receiver ${receiverIdentity.slack} has all items (expecting ${offer.instancesToReceive.length}`)
    const sourceHasAllItems = offer.instancesToGive.map(offerLinker => offerLinker.instance).every(offerInstance => { // this is O(n^2) at least, but idrc
      const sourceInstance = sourceIdentity.inventory.find(
        instance => instance.id === offerInstance.id
      )
      console.log(`Checking if source has ${offerInstance.quantity} of ${offerInstance.id}, found ${sourceInstance?.quantity}`)
      return sourceInstance && sourceInstance.quantity >= offerInstance.quantity
    })
    const receiverHasAllItems = offer.instancesToReceive.map(offerLinker => offerLinker.instance).every(offerInstance => {
      const receiverInstance = receiverIdentity.inventory.find(
        instance => instance.id === offerInstance.id
      )
      console.log(`Checking if receiver has ${offerInstance.quantity} of ${offerInstance.id}, found ${receiverInstance?.quantity}`)
      return receiverInstance && receiverInstance.quantity >= offerInstance.quantity
    })
    if (!sourceHasAllItems) {
      return await props.respond({
        replace_original: false,
        text: 'One or more items the other person wanted to offer you are no longer available. Ask the other party to re-send the offer with items they actually have.'
      })
    }
    if (!receiverHasAllItems) {
      return await props.respond({
        replace_original: false,
        text: 'One or more items the other person wanted from you are available. Ask the other party to re-send the offer with items you actually have.'
      })
    }
    // execute the trade: change ownership of the instances, then delete the Offer, then notify the parties.
    for (const sourceInstance of offer.instancesToGive.map(offerLinker => offerLinker.instance)) {
      console.log(`Transferring ${sourceInstance.quantity} of ${sourceInstance.id} from ${sourceIdentity.slack} to ${receiverIdentity.slack}`)
      await prisma.instance.update({
        where: { id: sourceInstance.id },
        data: { identityId: offer.targetIdentityId }
      })
    }
    for (const receiverInstance of offer.instancesToReceive.map(offerLinker => offerLinker.instance)) {
      console.log(`Transferring ${receiverInstance.quantity} of ${receiverInstance.id} from ${receiverIdentity.slack} to ${sourceIdentity.slack}`)
      await prisma.instance.update({
        where: { id: receiverInstance.id },
        data: { identityId: offer.sourceIdentityId }
      })
    }
    await props.respond({
      replace_original: true,
      text: `Trade completed with <@${offer.targetIdentityId}>! The items have been transferred. (you received ${offer.instancesToGive.map(offerLinker => offerLinker.instance).map(instance => `${instance.quantity} of ${instance.itemId}`).join(', ')}; you gave ${offer.instancesToReceive.map(offerLinker => offerLinker.instance).map(instance => `${instance.quantity} of ${instance.itemId}`).join(', ')})`
    })
    await web.chat.postMessage({
      channel: offer.sourceIdentityId,
      text: `Trade with <@${offer.targetIdentityId}> completed! (you gave ${offer.instancesToGive.map(offerLinker => offerLinker.instance).map(instance => `${instance.quantity} of ${instance.itemId}`).join(', ')}; you received ${offer.instancesToReceive.map(offerLinker => offerLinker.instance).map(instance => `${instance.quantity} of ${instance.itemId}`).join(', ')})`
    })
    if(offer.callbackUrl){
      try {
        await fetch(offer.callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ accepted: true })
        }) // tell the original bot that the trade was completed
      } catch (error) {
        console.log(`PROBABLY FINE: Error notifying original bot ${offer.sourceIdentityId} of declined trade at callback ${offer.callbackUrl}: ${error}. This is probably an issue with the requesting bot.`)
      }
    }
    await prisma.instanceOfferToGive.deleteMany({ where: { offerId: offer.id } })
    await prisma.instanceOfferToReceive.deleteMany({ where: { offerId: offer.id } })
    await prisma.offer.delete({ where: { id: offer.id } })
  })
})

slack.action('decline-offer', async props => {
  await execute(props, async props => {
    const offerIdStr: string = (props.action as ButtonAction).value; // we know that this event only comes from a button
    let offerId: number;
    try {
      offerId = parseInt(offerIdStr);
    } catch (error) {
      return await props.respond({
        replace_original: false,
        text: 'Invalid offer ID (this is a bug in Bag, go yell at @fed about this)'
      })
    }
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        instancesToGive: {
          include: {
            instance: true
          }
        },
        instancesToReceive: {
          include: {
            instance: true
          }
        
        }
      }
    })
    if (!offer) {
      return await props.respond({
        replace_original: false,
        text: 'Offer not found. This is probably a bug in Bag, go yell at @fed about this.'
      })
    }
    await props.respond({
      replace_original: true,
      text: `Trade declined with <@${offer.targetIdentityId}>. (you would have given ${offer.instancesToGive.map(offerLinker => offerLinker.instance).map(instance => `${instance.quantity} of ${instance.itemId}`).join(', ')}; you would have received ${offer.instancesToReceive.map(offerLinker => offerLinker.instance).map(instance => `${instance.quantity} of ${instance.itemId}`).join(', ')}`
    })
    await web.chat.postMessage({
      channel: offer.sourceIdentityId,
      text: `<@${offer.targetIdentityId}> declined your offer for a trade (you give ${offer.instancesToGive.map(offerLinker => offerLinker.instance).map(instance => `${instance.quantity} of ${instance.itemId}`).join(', ')}; you receive ${offer.instancesToReceive.map(offerLinker => offerLinker.instance).map(instance => `${instance.quantity} of ${instance.itemId}`).join(', ')})`
    })
    if(offer.callbackUrl){
      try {
        await fetch(offer.callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ accepted: false })
        }) // tell the original bot that the trade was declined
      } catch (error) {
        console.log(`PROBABLY FINE: Error notifying original bot ${offer.sourceIdentityId} of declined trade at callback ${offer.callbackUrl}: ${error}. This is probably an issue with the requesting bot.`)
      }
    }
    await prisma.instanceOfferToGive.deleteMany({ where: { offerId: offer.id } })
    await prisma.instanceOfferToReceive.deleteMany({ where: { offerId: offer.id } })
    await prisma.offer.delete({ where: { id: offer.id } })
  })
})

const tradeDialog = async (
  userId: string,
  tradeId: number,
  thread?: { channel: string; ts: string }
): Promise<View> => {
  const user = await prisma.identity.findUnique({
    where: {
      slack: userId
    },
    include: { inventory: true }
  })

  // Check if being used in crafting
  const crafting = await prisma.crafting.findFirst({
    where: {
      identityId: user.slack,
      recipeId: null
    },
    include: {
      inputs: true
    }
  })

  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      initiatorTrades: true,
      receiverTrades: true
    }
  })
  const tradeKey =
    trade.initiatorIdentityId === userId ? 'initiatorTrades' : 'receiverTrades'
  const currentTrades = trade[tradeKey]

  let offers = []
  let alreadyOffering = []
  let notOffering = []
  for (let instance of user.inventory) {
    // Check if offering
    const item = await prisma.item.findUnique({
      where: { name: instance.itemId }
    })

    const tradeInstance = currentTrades.find(
      tradeInstance => tradeInstance.instanceId === instance.id
    )
    if (tradeInstance) {
      alreadyOffering.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `x${tradeInstance.quantity} ${item.reaction} ${item.name}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Remove'
          },
          value: JSON.stringify({
            tradeInstanceId: tradeInstance.id,
            tradeId,
            ...thread
          }),
          action_id: 'remove-trade'
        }
      })
      continue
    }

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
    const otherOffers = trades
      .map(offer => ({
        ...offer,
        trades: [...offer.initiatorTrades, ...offer.receiverTrades]
      }))
      .filter(offer =>
        offer.trades.find(trade => trade.instanceId === instance.id)
      )
    let quantityLeft = otherOffers.reduce((acc, curr) => {
      return (
        acc -
        curr.trades.find(trade => trade.instanceId === instance.id).quantity
      )
    }, instance.quantity)

    // Check if already using crafting
    const inCrafting = crafting?.inputs.find(
      input => input.instanceId === instance.id
    )
    if (inCrafting) {
      quantityLeft -= inCrafting.quantity
      notOffering.push(
        `x${inCrafting.quantity} ${item.reaction} ${item.name} being used for crafting`
      )
    }

    if (item.tradable === false) // assume items are tradable unless they say otherwise as some items might not have that property
      notOffering.push(`x${instance.quantity} ${item.reaction} ${item.name} untradable`)
    else if (quantityLeft)
      offers.push({
        text: {
          type: 'plain_text',
          text: `x${quantityLeft} ${item.reaction} ${instance.itemId}`
        },
        value: JSON.stringify({
          id: instance.id,
          quantity: quantityLeft
        })
      })
    for (let offer of otherOffers)
      notOffering.push(
        `x${
          offer.trades.find(trade => trade.instanceId === instance.id).quantity
        } ${item.reaction} ${item.name} in trade with <@${
          offer.initiatorIdentityId === user.slack
            ? offer.receiverIdentityId
            : offer.initiatorIdentityId
        }>`
      )
  }

  let view: View = {
    callback_id: 'add-trade',
    title: {
      type: 'plain_text',
      text: 'Edit offer'
    },
    submit: {
      type: 'plain_text',
      text: 'Add to trade'
    },
    close: {
      type: 'plain_text',
      text: 'Close window'
    },
    type: 'modal',
    private_metadata: JSON.stringify({ tradeId, ...thread }),
    external_id: `${user.slack}-${tradeId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "*You're offering:*"
        }
      },
      ...(alreadyOffering.length
        ? alreadyOffering
        : [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '_Nothing yet._'
              }
            }
          ]),
      {
        type: 'input',
        element: {
          action_id: 'instance',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Add an item'
          },
          options: views.sortDropdown(offers)
        },
        label: {
          type: 'plain_text',
          text: 'Add item to trade'
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
      }
    ]
  }
  if (notOffering.length) {
    view.blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "Items you own that you're currently using somewhere else:"
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
  }

  return view
}

const showTrade = async (
  giverId: string,
  receiverId: string,
  tradeId: number,
  thread?: { channel: string; ts: string },
  closed?: boolean
): Promise<(Block | KnownBlock)[]> => {
  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      initiatorTrades: true,
      receiverTrades: true
    }
  })

  const giverTrades = await Promise.all(
    trade.initiatorTrades.map(async tradeInstance => {
      const instance = await prisma.instance.findUnique({
        where: { id: tradeInstance.instanceId },
        include: { item: true }
      })

      return `x${tradeInstance.quantity} ${instance.item.reaction} ${instance.item.name}`
    })
  )

  const receiverTrades = await Promise.all(
    trade.receiverTrades.map(async tradeInstance => {
      const instance = await prisma.instance.findUnique({
        where: { id: tradeInstance.instanceId },
        include: { item: true }
      })
      return `x${tradeInstance.quantity} ${instance.item.reaction} ${instance.item.name}`
    })
  )

  let actions: Button[] = []
  if (!trade.initiatorAgreed && !trade.receiverAgreed)
    actions.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Edit offer'
      },
      action_id: 'edit-offer',
      value: JSON.stringify({
        tradeId,
        ...thread
      }),
      style: 'primary'
    })
  if (!closed && (!trade.initiatorAgreed || !trade.receiverAgreed))
    actions.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Decline trade'
      },
      value: JSON.stringify({ tradeId, ...thread }),
      action_id: 'decline-trade',
      style: 'danger'
    })
  if (!closed && trade.initiatorTrades.length && trade.receiverTrades.length)
    actions.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'Confirm trade'
      },
      value: JSON.stringify({ tradeId, ...thread }),
      action_id: 'accept-trade',
      style: 'primary'
    })

  let blocks: (Block | KnownBlock)[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: closed
          ? `<@${giverId}> closed a trade with <@${receiverId}>. <@${receiverId}> received:`
          : `<@${giverId}> has proposed a trade with <@${receiverId}>, offering:`
      }
    },
    giverTrades.length
      ? {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: giverTrades.join('\n')
          }
        }
      : {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '_Nothing yet._'
          }
        },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: closed
          ? `In exchange, <@${giverId}> received:`
          : `In exchange, <@${receiverId}> offers:`
      }
    },
    receiverTrades.length
      ? {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: receiverTrades.join('\n')
          }
        }
      : {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '_Nothing yet._'
          }
        }
  ]
  if (!closed)
    blocks.push({
      type: 'actions',
      elements: actions
    })
  return blocks
}

const startTrade = async (
  giverId: string,
  receiverId: string,
  channel: string
): Promise<View> => {
  const user = await prisma.identity.findUnique({
    where: { slack: giverId },
    include: { inventory: true }
  })

  // Check if being used in crafting
  const crafting = await prisma.crafting.findFirst({
    where: {
      identityId: user.slack,
      recipeId: null
    },
    include: {
      inputs: true
    }
  })

  let offers = []
  let notOffering = []
  for (let instance of user.inventory) {
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
    let quantityLeft = otherOffers.reduce((acc, curr) => {
      return (
        acc -
        curr.trades.find(trade => trade.instanceId === instance.id).quantity
      )
    }, instance.quantity)
    // Check if already using in crafting
    const inCrafting = crafting?.inputs.find(
      input => input.instanceId === instance.id
    )
    if (inCrafting) {
      quantityLeft -= inCrafting.quantity
      notOffering.push(
        `x${inCrafting.quantity} ${item.reaction} ${item.name} being used for crafting`
      )
    }
    if (item.tradable === false) {// assume items are tradable unless they say otherwise as some items might not have that property
      notOffering.push(`x${instance.quantity} ${item.reaction} ${item.name} untradable`)
    }
    else if (quantityLeft > 0)
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
          offer.initiatorIdentityId === user.slack
            ? offer.receiverIdentityId
            : offer.initiatorIdentityId
        }>`
      )
    }
  }

  let view: View = {
    callback_id: 'start-trade',
    title: {
      type: 'plain_text',
      text: 'Start trade'
    },
    submit: {
      type: 'plain_text',
      text: 'Start trade'
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
          options: views.sortDropdown(offers)
        },
        label: {
          type: 'plain_text',
          text: 'Choose an initial item'
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
      }
    ]
  }

  if (notOffering.length){
    view.blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "Items you own that you're currently using somewhere else:"
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
  }
  return view
}
