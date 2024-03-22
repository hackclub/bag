import { log } from '../../analytics'
import { prisma } from '../../db'
import { mappedPermissionValues } from '../../permissions'
import { channelBlacklist, channels, inMaintainers } from '../../utils'
import slack, { execute } from '../slack'
import views from '../views'
import type { Block, KnownBlock, View } from '@slack/bolt'

const craft = async (slack: string, craftingId: number, recipeId: number) => {
  const crafting = await prisma.crafting.findUnique({
    where: { id: craftingId }
  })

  const updated = await prisma.crafting.update({
    where: { id: craftingId },
    data: { recipeId },
    include: {
      recipe: {
        include: {
          inputs: true,
          tools: true,
          outputs: { include: { recipeItem: true } }
        }
      },
      inputs: { include: { instance: true } }
    }
  })

  // Deduce inputs (not tools) from users' inventory
  for (let part of updated.recipe.inputs) {
    const instance = updated.inputs.find(
      instance => instance.recipeItemId === part.recipeItemId
    )
    if (part.quantity < instance.instance.quantity) {
      // Subtract from quantity
      await prisma.instance.update({
        where: { id: instance.instanceId },
        data: { quantity: instance.instance.quantity - part.quantity }
      })
    } else {
      // Detach entire instance
      await prisma.instance.update({
        where: { id: instance.instanceId },
        data: {
          identity: { disconnect: true }
        }
      })
    }
  }

  // Give user the output
  for (let output of updated.recipe.outputs) {
    // Check if user already has an instance and add to that instance
    const existing = await prisma.instance.findFirst({
      where: {
        identityId: slack,
        itemId: output.recipeItemId
      }
    })

    if (existing)
      await prisma.instance.update({
        where: { id: existing.id },
        data: { quantity: output.quantity + existing.quantity }
      })
    else
      await prisma.instance.create({
        data: {
          itemId: output.recipeItemId,
          identityId: crafting.identityId,
          quantity: output.quantity,
          public: output.recipeItem.public
        }
      })
  }
}

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
          recipe: null
        }
      })
      if (crafting?.recipeId)
        return await props.respond({
          response_type: 'ephemeral',
          text: "Woah woah woah! It's all said and done."
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
            if (index >= 0) {
              acc[index].quantity++
            } else acc.push({ quantity: 1, reaction: curr })
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
    const input = await prisma.recipeItem.create({
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

    await craft(props.body.user.id, Number(craftingId), Number(recipeId))

    // @ts-expect-error
    await props.client.chat.update({
      channel,
      ts,
      blocks: await showCrafting(
        props.body.user.id,
        craftingId,
        { channel, ts },
        true
      )
    })
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
        ] // Either in initiatorTrades or receiverTrades
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

const showCrafting = async (
  userId: string,
  craftingId: number,
  thread?: { channel: string; ts: string },
  crafted: boolean = false
): Promise<(Block | KnownBlock)[]> => {
  const crafting = await prisma.crafting.findUnique({
    where: { id: craftingId },
    include: {
      inputs: true,
      recipe: {
        include: {
          inputs: { include: { recipeItem: true } },
          tools: { include: { recipeItem: true } },
          outputs: { include: { recipeItem: true } }
        }
      }
    }
  })

  let canMake = []
  const qualify = (inputs, tools): boolean => {
    for (let part of [...inputs, ...tools]) {
      const query = crafting.inputs.find(input => {
        return (
          input.recipeItemId === part.recipeItemId &&
          input.quantity >= part.quantity
        )
      })
      if (!query) return false
    }
    return true
  }

  const inputs = await Promise.all(
    crafting.inputs.map(async input => {
      const item = await prisma.item.findUnique({
        where: { name: input.recipeItemId }
      })

      let partOf = await prisma.recipe.findMany({
        where: {
          OR: [
            {
              inputs: { some: { recipeItemId: item.name, instanceId: null } }
            },
            { tools: { some: { recipeItemId: item.name, instanceId: null } } }
          ] // Either in inputs or tools and not being used in crafting
        },
        include: {
          inputs: { include: { recipeItem: true } },
          tools: { include: { recipeItem: true } },
          outputs: { include: { recipeItem: true } }
        }
      })
      partOf = partOf.filter(recipe => {
        // Exact inputs and tools
        const inputs = [...recipe.inputs, ...recipe.tools]
        let covered = []
        for (let input of inputs) {
          const index = crafting.inputs.findIndex(
            instance => instance.recipeItemId === input.recipeItemId
          )
          if (index < 0) return false
          covered.push(index)
        }
        if (covered.length !== crafting.inputs.length) return false
        return true
      })

      canMake.push(
        ...partOf.map(recipe => {
          let inputs = recipe.inputs
            .map(input => input.recipeItem.reaction.repeat(input.quantity))
            .join('')
          let tools = recipe.tools
            .map(tool => tool.recipeItem.reaction.repeat(tool.quantity))
            .join('')
          let outputs = recipe.outputs
            .map(
              output =>
                `x${output.quantity} ${output.recipeItem.reaction} ${output.recipeItem.name}`
            )
            .join(', ')
          let formatted =
            inputs +
            (tools.length ? ' ~ ' + tools : '') +
            ' *→* ' +
            outputs +
            '\n'
          let block: Block | KnownBlock = {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: formatted
            }
          }
          if (qualify(recipe.inputs, recipe.tools))
            // Check if we have all the inputs and tools, and add craft button if so
            block.accessory = {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Craft'
              },
              value: JSON.stringify({
                craftingId,
                recipeId: recipe.id,
                ...thread
              }),
              action_id: 'complete-crafting'
            }
          return block
        })
      )

      return `x${input.quantity} ${item.reaction} ${item.name}`
    })
  )

  // Find all recipes that includes the inputs as either an input or a tool
  let blocks: (Block | KnownBlock)[] = []
  if (crafted) {
    const { recipe } = crafting
    const { outputs } = recipe
    const formatted = outputs.map(
      output =>
        `x${output.quantity} ${output.recipeItem.reaction} ${output.recipeItem.name}`
    )
    const inputs = recipe.inputs
      .map(
        input =>
          `x${input.quantity} ${input.recipeItem.reaction} ${input.recipeItem.name}`
      )
      .join(', ')
    const tools = recipe.tools
      .map(
        tool =>
          `x${tool.quantity} ${tool.recipeItem.reaction} ${tool.recipeItem.name}`
      )
      .join(', ')
    const outputsFormatted = recipe.outputs
      .map(
        output =>
          `x${output.quantity} ${output.recipeItem.reaction} ${output.recipeItem.name}`
      )
      .join(', ')
    const recipeFormatted =
      inputs + (tools.length ? ' + ' + tools : '') + ' → ' + outputsFormatted
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${userId}> just crafted ${outputsFormatted}.\n>${crafting.recipe.description}`
      }
    })
  } else
    blocks.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<@${userId}> is trying to craft something.`
        }
      },
      inputs.length
        ? {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text:
                inputs.length === 1
                  ? inputs[0]
                  : inputs.slice(0, inputs.length - 1).join(', ') +
                    (inputs.length > 2 ? ',' : '') +
                    ' and ' +
                    inputs[inputs.length - 1]
            }
          }
        : {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '_Add something from your inventory to see what you can make with it._'
            }
          },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: 'Looks like you can make:'
        }
      },
      ...(canMake.length
        ? canMake.filter((block, i) => {
            const index = canMake.findIndex(
              j => j.text.text === block.text.text
            )
            if (index === i) return true
            return false
          })
        : [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: "_You can't make anything with those ingredients._"
              }
            } as Block
          ])
    )

  if (!crafted)
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Edit'
          },
          value: JSON.stringify({ craftingId, ...thread }),
          style: 'primary',
          action_id: 'edit-crafting'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Cancel'
          },
          value: JSON.stringify({ craftingId, ...thread }),
          style: 'danger',
          action_id: 'cancel-crafting'
        }
      ]
    })
  return blocks
}
