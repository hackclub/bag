import { prisma } from '../../db'
import { debug } from '../../logger'
import { channelBlacklist, channels } from '../../utils'
import slack, { execute } from '../slack'
import views from '../views'
import type { Block, KnownBlock, View } from '@slack/bolt'

slack.command('/huh', async props => {
  return await execute(props, async props => {
    if (
      ![
        'U03MNFDRSGJ',
        'UDK5M9Y13',
        'U032A2PMSE9',
        'U05TXCSCK7E',
        'U0C7B14Q3'
      ].includes(props.context.userId)
    )
      return await props.client.chat.postMessage({
        channel: props.context.userId,
        user: props.context.userId,
        text: "You found something... but it's not quite ready yet."
      })

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

slack.view('start-crafting', async props => {
  return await execute(props, async props => {
    let fields: {
      input: any
      quantity: number
      input2: any
      quantity2: number
    } = {
      input: undefined,
      quantity: 1,
      input2: undefined,
      quantity2: undefined
    }
    for (let field of Object.values(props.view.state.values))
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]]?.value ||
        Object.values(field)[0].selected_option?.value ||
        ''
    fields.input = JSON.parse(fields.input)
    fields.input2 = JSON.parse(fields.input2)
    fields.quantity = Number(fields.quantity)
    fields.quantity2 = Number(fields.quantity2)

    const { channel: openChannel } = JSON.parse(props.view.private_metadata)

    // Make sure inputs aren't the same or they don't surpass quantity of available
    const instance = await prisma.instance.findUnique({
      where: { id: fields.input.id }
    })
    const instance2 = await prisma.instance.findUnique({
      where: { id: fields.input2.id }
    })

    // Create inputs
    const input = await prisma.recipeItem.create({
      data: {
        recipeItemId: instance.itemId,
        instanceId: instance.id,
        quantity: fields.input.quantity
      }
    })
    const input2 = await prisma.recipeItem.create({
      data: {
        recipeItemId: instance2.itemId,
        instanceId: instance2.id,
        quantity: fields.input2.quantity
      }
    })

    // Create new entry in Crafting table
    const crafting = await prisma.crafting.create({
      data: {
        identityId: props.context.userId,
        inputs: { connect: [{ id: input.id }, { id: input2.id }] }
      }
    })

    const { channel, ts } = await props.client.chat.postMessage({
      channel: openChannel,
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
  })
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
        text: "Woah woah woah! You can't edit someone else's crafting."
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

    // Check and make sure adding is valid

    // Add to crafting by creating instance
    const instance = await prisma.instance.findUnique({
      where: { id: fields.instance.id }
    })
    const input = await prisma.recipeItem.create({
      data: {
        recipeItemId: instance.itemId,
        instanceId: instance.id,
        quantity: fields.instance.quantity,
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
  return await execute(props, async props => {})
})

slack.action('complete-crafting', async props => {
  return await execute(props, async props => {
    // Complete crafting with given recipe
    // @ts-expect-error
    let { craftingId, recipeId, channel, ts } = JSON.parse(props.action.value)
    console.log(craftingId, recipeId, channel, ts)

    const crafting = await prisma.crafting.findUnique({
      where: { id: craftingId }
    })
    if (crafting.identityId !== props.body.user.id)
      return await props.respond({
        response_type: 'ephemeral',
        replace_original: false,
        text: "Woah woah woah! That's not yours to craft."
      })

    // Link recipe to "close" crafting
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

    // Deduct inputs (not tools) from user's inventory
    for (let part of updated.inputs) {
      const { instance } = part
      if (part.quantity < instance.quantity) {
        // Subtract from quantity
        await prisma.instance.update({
          where: { id: instance.id },
          data: { quantity: instance.quantity - part.quantity }
        })
      } else {
        // Detach entire instance
        await prisma.instance.update({
          where: { id: instance.id },
          data: {
            identity: { disconnect: true }
          }
        })
      }
    }

    // Give user the output
    for (let output of updated.recipe.outputs) {
      await prisma.instance.create({
        data: {
          itemId: output.recipeItemId,
          identityId: crafting.identityId,
          quantity: output.quantity,
          public: output.recipeItem.public
        }
      })
    }

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
  for (let part of crafting.inputs) {
    alreadyUsing.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `x${part.quantity} ${part.recipeItem.reaction} ${part.recipeItem.name}`
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Remove'
        },
        value: JSON.stringify({
          craftingId: crafting.id,
          craftingInstanceId: part.id,
          ...thread
        }),
        action_id: 'remove-crafting'
      }
    })
  }

  let possible = []
  let inTrades = []

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

      possible.push({
        text: {
          type: 'plain_text',
          text: `x${instance.quantity} ${ref.reaction} ${ref.name}`
        },
        value: JSON.stringify({
          id: instance.id,
          quantity: instance.quantity
        })
      })
    })
  )

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
          options: possible
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
      canMake.push(
        ...partOf.map(recipe => {
          let inputs = recipe.inputs
            .map(
              input =>
                `x${input.quantity} ${input.recipeItem.reaction} ${input.recipeItem.name}`
            )
            .join(', ')
          let tools = recipe.tools
            .map(
              tool =>
                `x${tool.quantity} ${tool.recipeItem.reaction} ${tool.recipeItem.name}`
            )
            .join(', ')
          let outputs = recipe.outputs
            .map(
              output =>
                `x${output.quantity} ${output.recipeItem.reaction} ${output.recipeItem.name}`
            )
            .join(', ')
          let formatted =
            inputs + (tools.length ? ' + ' + tools : '') + ' → ' + outputs
          if (
            canMake.find(
              block => block !== false && block.text.text === formatted
            )
          )
            return false
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
        text: `<@${userId}> just crafted ${recipeFormatted}\n>_${crafting.recipe.description}_`
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
                inputs.slice(0, inputs.length - 1).join(', ') +
                (inputs.length > 2 ? ',' : '') +
                ' and ' +
                inputs[inputs.length - 1]
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
          text: 'Looks like you can make:'
        }
      },
      ...(canMake.length
        ? canMake.filter(block => block !== false)
        : [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Nothing?'
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
          value: JSON.stringify({ craftingId }),
          style: 'danger',
          action_id: 'cancel-crafting'
        }
      ]
    })
  return blocks
}

const startCrafting = async (
  userId: string,
  channel: string
): Promise<View> => {
  // Inputs, outputs, and tools
  const user = await prisma.identity.findUnique({
    where: { slack: userId },
    include: { inventory: true }
  })

  let possible = []
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
            {
              receiverTrades: { some: { instanceId: instance.id } }
            }
          ] // Either in initiatorTrades or receiverTrads
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
      const crafting = await prisma.crafting.findMany({
        where: {
          recipeId: null,
          identityId: user.slack
        }
      })

      possible.push({
        text: {
          type: 'plain_text',
          text: `x${instance.quantity} ${ref.reaction} ${ref.name}`
        },
        value: JSON.stringify({
          id: instance.id,
          quantity: instance.quantity
        })
      })
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
    blocks: [
      {
        type: 'input',
        element: {
          action_id: 'input',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Initial input'
          },
          options: possible
        },
        label: {
          type: 'plain_text',
          text: 'Initial input item'
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
        element: {
          action_id: 'input2',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Second input'
          },
          options: possible
        },
        label: {
          type: 'plain_text',
          text: 'Second input item'
        }
      },
      {
        type: 'input',
        element: {
          type: 'number_input',
          is_decimal_allowed: false,
          action_id: 'quantity2',
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
