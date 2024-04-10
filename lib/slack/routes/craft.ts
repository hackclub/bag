import { log } from '../../analytics'
import { prisma } from '../../db'
import { mappedPermissionValues } from '../../permissions'
import { scheduler } from '../../queue/craft'
import { ms } from '../../queue/queue'
import { channelBlacklist, channels } from '../../utils'
import slack, { execute } from '../slack'
import views, { showCrafting } from '../views'
import type { Block, KnownBlock, View } from '@slack/bolt'

slack.command('/craft', async props => {
  return await execute(
    props,
    async props => {
      const timestamp = Date.now()
      await log('slack-craft', `${props.context.userId}-${timestamp}`, {
        channel: props.body.channel_id,
        user: (await props.client.users.info({ user: props.context.userId }))
          .user.profile.display_name
      })

      try {
        const conversation = await props.client.conversations.info({
          channel: props.body.channel_id
        })
        if (channelBlacklist.includes(conversation.channel.id))
          return await props.respond({
            response_type: 'ephemeral',
            text: `Crafting in this channel isn't allowed. Try running \`/craft\` in a public channel, like <#${channels.lounge}>!`
          })
        else if (conversation.channel.is_im || conversation.channel.is_mpim)
          return await props.respond({
            response_type: 'ephemeral',
            text: `Crafting in DMs isn't allowed yet. Try running \`/craft\` in a public channel, like <#${channels.lounge}>!`
          })
      } catch {
        return await props.respond({
          response_type: 'ephemeral',
          text: `Crafting in DMs isn't allowed yet. Try running \`/craft\` in a public channel, like <#${channels.lounge}>!`
        })
      }

      let crafting = await prisma.crafting.findFirst({
        where: {
          identityId: props.context.userId,
          done: false
        }
      })
      if (crafting?.recipeId)
        // Currently crafting something
        return await props.respond({
          response_type: 'ephemeral',
          text: "Woah woah woah! Looks like you're currently crafting something."
        })
      if (!crafting)
        crafting = await prisma.crafting.create({
          data: { identityId: props.context.userId }
        })
      else if (crafting.channel && crafting.ts) {
        // Delete previous thread
        try {
          await props.client.chat.delete({
            channel: crafting.channel,
            ts: crafting.ts
          })
        } catch {}
      }

      if (props.body.text.startsWith(':')) {
        // Craft directly
        const reactions = props.body.text
          .trim()
          .split(' ')
          .reduce((acc: any, curr) => {
            const index = acc.findIndex(reaction => reaction.reaction === curr)
            if (index >= 0) acc[index].quantity++
            else acc.push({ quantity: 1, reaction: curr })
            return acc
          }, [])
        const items = await prisma.item.findMany({
          where: {
            reaction: { in: props.body.text.trim().split(' ') }
          }
        })

        if (items.length) {
          // Make sure user has access to all items
          let instances = {}
          for (let item of items) {
            const reaction = reactions.find(
              reaction => reaction.reaction === item.reaction
            )
            const instance = await prisma.instance.findFirst({
              where: {
                identityId: props.context.userId,
                itemId: item.name,
                quantity: {
                  gte: reaction.quantity
                }
              }
            })
            if (!instance)
              return await props.respond({
                response_type: 'ephemeral',
                text: `Woah woah woah! It doesn't look like you have ${reaction.quantity} ${item.reaction} ${item.name} to craft. You could possibly be using ${item.reaction} ${item.name} somewhere else.`
              })
            else
              instances[item.name] = {
                id: instance.id,
                quantity: reaction.quantity
              }
          }

          // Create instances
          let inputs = []
          for (let item of items) {
            inputs.push(
              await prisma.recipeItem.create({
                data: {
                  recipeItemId: item.name,
                  instanceId: instances[item.name].id,
                  quantity: instances[item.name].quantity,
                  craftingInputs: { connect: { id: crafting.id } }
                }
              })
            )
          }
        }
      }

      const { channel, ts } = await props.client.chat.postMessage({
        channel: props.body.channel_id,
        blocks: await showCrafting(props.context.userId, crafting.id)
      })

      await props.client.chat.update({
        channel,
        ts,
        blocks: await showCrafting(props.context.userId, crafting.id, {
          channel,
          ts
        })
      })

      // Update crafting with new channel and thread
      await prisma.crafting.update({
        where: { id: crafting.id },
        data: { channel, ts }
      })
    },
    mappedPermissionValues.READ,
    true
  )
})

slack.action('edit-crafting', async props => {
  return await execute(props, async props => {
    // @ts-expect-error
    const { craftingId, channel, ts } = JSON.parse(props.action.value)

    const crafting = await prisma.crafting.findUnique({
      where: { id: craftingId }
    })
    if (crafting.identityId !== props.body.user.id)
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! Don't be rude, you can't mess with the stuff on someone else's worktable."
      })
    else if (crafting.recipeId)
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! It's all said and done."
      })

    // @ts-expect-error
    const { view } = await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.body.trigger_id,
      view: views.loadingDialog('Edit crafting')
    })

    // @ts-expect-error
    await props.client.views.update({
      view_id: view.id,
      view: await craftingDialog(props.body.user.id, craftingId, {
        channel,
        ts
      })
    })
  })
})

slack.view('add-crafting', async props => {
  return await execute(props, async props => {
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

    const { craftingId, channel, ts } = JSON.parse(props.view.private_metadata)

    const instance = await prisma.instance.findUnique({
      where: { id: fields.instance.id },
      include: { item: true }
    })

    if (fields.quantity > fields.instance.quantity)
      return await props.client.chat.postEphemeral({
        channel,
        user: props.body.user.id,
        text: `Woah woah woah! It doesn't look like you have ${fields.quantity} ${instance.item.reaction} ${instance.item.name} to add. You could possibly be using ${instance.item.reaction} ${instance.item.name} somewhere else.`
      })

    // Add to crafting by creating instance
    await prisma.recipeItem.create({
      data: {
        recipeItemId: instance.itemId,
        instanceId: instance.id,
        quantity: fields.quantity,
        craftingInputs: { connect: { id: craftingId } }
      }
    })

    // Update thread
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showCrafting(props.body.user.id, craftingId, {
        channel,
        ts
      })
    })
  })
})

slack.action('remove-crafting', async props => {
  return await execute(props, async props => {
    // Remove from crafting
    const { craftingId, craftingInstanceId, channel, ts } = JSON.parse(
      // @ts-expect-error
      props.action.value
    )

    await prisma.recipeItem.delete({ where: { id: craftingInstanceId } })

    // @ts-expect-error
    await props.client.views.update({
      external_id: `${props.body.user.id}-crafting-${craftingId}`,
      view: await craftingDialog(props.body.user.id, craftingId, {
        channel,
        ts
      })
    })

    // @ts-expect-error
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showCrafting(props.body.user.id, craftingId, {
        channel,
        ts
      })
    })
  })
})

slack.action('cancel-crafting', async props => {
  return await execute(props, async props => {
    // @ts-expect-error
    const { craftingId, channel, ts, running } = JSON.parse(props.action.value)

    const crafting = await prisma.crafting.findUnique({
      where: { id: craftingId }
    })
    if (crafting.identityId !== props.body.user.id)
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! Don't be rude, you can't mess with the stuff on someone else's worktable."
      })

    await prisma.crafting.delete({
      where: { id: craftingId }
    })

    // @ts-expect-error
    await props.client.chat.delete({
      channel,
      ts
    })
  })
})

slack.action('complete-crafting', async props => {
  return await execute(props, async props => {
    // Complete crafting with given recipe
    // @ts-expect-error
    let { craftingId, recipeId, channel, ts } = JSON.parse(props.action.value)

    const crafting = await prisma.crafting.findUnique({
      where: { id: craftingId }
    })
    if (crafting.identityId !== props.body.user.id)
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! Don't be rude, you can't mess with the stuff on someone else's worktable."
      })

    const updated = await prisma.crafting.update({
      where: { id: craftingId },
      data: { recipeId },
      include: { recipe: true }
    })

    scheduler.schedule(
      {
        slack: props.body.user.id,
        craftingId: crafting.id,
        thread: { channel, ts },
        time: updated.recipe.time || ms(0, 30, 0)
      },
      new Date().getTime()
    )
  })
})

const craftingDialog = async (
  userId: string,
  craftingId: number,
  thread?: { channel: string; ts: string }
): Promise<View> => {
  const crafting = await prisma.crafting.findUnique({
    where: { id: craftingId },
    include: {
      inputs: { include: { recipeItem: true } },
      identity: { include: { inventory: true } }
    }
  })

  const { identity: user } = crafting

  let alreadyUsing: (Block | KnownBlock)[] = []

  let possible = []
  let inTrades = []

  for (let instance of user.inventory) {
    // Check if already using
    const using = crafting.inputs.find(
      input => input.instanceId === instance.id
    )
    if (using) {
      alreadyUsing.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `x${using.quantity} ${using.recipeItem.reaction} ${using.recipeItem.name}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Remove'
          },
          value: JSON.stringify({
            craftingId: crafting.id,
            craftingInstanceId: using.id,
            ...thread
          }),
          action_id: 'remove-crafting'
        }
      })
      continue
    }

    // Check if offering in a trade
    const otherTrades = await prisma.trade.findMany({
      where: {
        closed: false, // Not closed
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
    const ref = await prisma.item.findUnique({
      where: { name: instance.itemId }
    })
    let otherOffers = otherTrades.map(offer => ({
      ...offer,
      trades: [...offer.initiatorTrades, ...offer.receiverTrades]
    }))
    let quantityLeft = otherOffers.reduce((acc, curr) => {
      return (
        acc -
        curr.trades.find(trade => trade.instanceId === instance.id).quantity
      )
    }, instance.quantity)
    if (quantityLeft)
      possible.push({
        text: {
          type: 'plain_text',
          text: `x${quantityLeft} ${ref.reaction} ${ref.name}`
        },
        value: JSON.stringify({
          id: instance.id,
          quantity: quantityLeft
        })
      })
    for (let offer of otherOffers) {
      inTrades.push(
        `x${
          offer.trades.find(trade => trade.instanceId === instance.id).quantity
        } ${ref.reaction} ${ref.name} in trade with <@${
          offer.initiatorIdentityId === userId
            ? offer.receiverIdentityId
            : offer.initiatorIdentityId
        }>`
      )
    }
  }

  let view: View = {
    callback_id: 'add-crafting',
    title: {
      type: 'plain_text',
      text: 'Edit crafting'
    },
    submit: {
      type: 'plain_text',
      text: 'Add to crafting'
    },
    close: {
      type: 'plain_text',
      text: 'Close window'
    },
    type: 'modal',
    private_metadata: JSON.stringify({ craftingId, ...thread }),
    external_id: `${userId}-crafting-${craftingId}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: "*What you're using:*"
        }
      },
      ...(alreadyUsing.length
        ? alreadyUsing
        : [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '_Nothing yet._'
              }
            } as Block
          ]),
      {
        type: 'input',
        element: {
          action_id: 'instance',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Item'
          },
          options: views.sortDropdown(possible)
        },
        label: {
          type: 'plain_text',
          text: 'Add item to crafting'
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
