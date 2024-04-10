import { prisma } from '../db'
import type {
  Block,
  KnownBlock,
  PlainTextOption,
  View,
  ViewStateValue
} from '@slack/bolt'

const error = (err: string) => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: err
      }
    }
  ]
}

export const cascadingPermissions = [
  {
    text: {
      type: 'plain_text',
      text: 'Read',
      emoji: true
    },
    value: 'READ'
  },
  {
    text: {
      type: 'plain_text',
      text: 'Read private',
      emoji: true
    },
    value: 'READ_PRIVATE'
  },
  {
    text: {
      type: 'plain_text',
      text: 'Write specific',
      emoji: true
    },
    value: 'WRITE_SPECIFIC'
  },
  {
    text: {
      type: 'plain_text',
      text: 'Write all',
      emoji: true
    },
    value: 'WRITE'
  },
  {
    text: {
      type: 'plain_text',
      text: 'Admin',
      emoji: true
    },
    value: 'ADMIN'
  }
]

const helpDialog: (Block | KnownBlock)[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Hi! I am a bag. Here's a list of available commands.

\`/item <item>\`: Get info about an item.
\`/bag me/@<person>\`: Check out your bag, or view somebody else's!
\`/trade @<person>\`: Start a trade with someone else!
\`/give @<person>\`: Start a trade with someone else!

And of course, here is a list of things of things you can mention me for:

* \`me\`: Check out your bag! This will list all your public items.
* \`@<person>\`: Check out another Hack Clubber's bag! This will list all their public items.`
    }
  }
]

const loadingDialog = (title: string): View => {
  return {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: title
    },
    close: {
      type: 'plain_text',
      text: 'Cancel'
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: ':spin-loading: Loading...'
        }
      }
    ]
  }
}

const sortDropdown = (
  dropdown: PlainTextOption[],
  func?: (a: PlainTextOption, b: PlainTextOption) => number
): PlainTextOption[] => {
  // Sort dropdowns that show items
  if (func) return dropdown.sort(func)
  return dropdown.sort((a, b) => {
    const aSplit = a.text.text.trim().split(' ')
    const bSplit = b.text.text.trim().split(' ')
    return aSplit.slice(1).join(' ').localeCompare(bSplit.slice(1).join(' '))
  })
}

const splitDropdown = (
  options: PlainTextOption[],
  initial_options: PlainTextOption[],
  element: {
    action_id: string
    type: 'multi_static_select' | 'static_select'
    placeholder: {
      type: 'plain_text'
      text: string
    }
  },
  extra: {
    label: {
      type: 'plain_text'
      text: string
    }
    optional?: boolean
  }
): (Block | KnownBlock)[] => {
  // Split dropdown with > 100 items into multiple dropdowns
  options = sortDropdown(options)
  let dropdowns: (Block | KnownBlock)[] = []
  let i = 0
  while (options.length) {
    i++
    if (options.length > 100) {
      const slice = options.splice(0, 100)
      const starting = initial_options.filter(option =>
        slice.find(possible => possible.value === option.value)
      )
      dropdowns.push({
        type: 'input',
        element: {
          ...{
            ...element,
            action_id: `${element.action_id}${i}`
          },
          options: slice,
          initial_options: starting.length ? starting : undefined
        },
        ...extra
      })
    } else {
      const starting = initial_options.filter(option =>
        options.find(possible => possible.value === option.value)
      )
      dropdowns.push({
        type: 'input',
        element: {
          ...{
            ...element,
            action_id: `${element.action_id}${i}`
          },
          options,
          initial_options: starting.length ? starting : undefined
        },
        ...extra,
        hint: {
          type: 'plain_text',
          text: `We've separated the dropdowns above into ${i} separate ones because of Slack's dropdown limits.`
        }
      })
      break
    }
  }
  return dropdowns
}

const readFields = (values: {
  [blockId: string]: {
    [actionId: string]: ViewStateValue
  }
}): any => {
  let fields = {}
  for (let field of Object.values(values)) {
    if (field[Object.keys(field)[0]].value === null) continue
    fields[Object.keys(field)[0]] =
      field[Object.keys(field)[0]]?.value ||
      Object.values(field)[0].selected_option?.value ||
      ''
    if (fields[Object.keys(field)[0]] === 'true')
      fields[Object.keys(field)[0]] = true
    else if (fields[Object.keys(field)[0]] === 'false')
      fields[Object.keys(field)[0]] = false
  }
  return fields
}

export const showCrafting = async (
  userId: string,
  craftingId: number,
  thread?: { channel: string; ts: string }
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

  // find all recipes that includes the inputs as either an input or a tool
  let blocks: (Block | KnownBlock)[] = []
  if (crafting.done) {
    const { recipe } = crafting
    const outputsFormatted = recipe.outputs
      .map(
        output =>
          `x${output.quantity} ${output.recipeItem.reaction} ${output.recipeItem.name}`
      )
      .join(', ')
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${userId}> just crafted ${outputsFormatted}.\n>${crafting.recipe.description}`
      }
    })
  } else {
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
            ] // Either in inputs or tools and not being used in crafting,
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
              // Check if we have all the inputs and tools, and add craft button
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
  }

  if (!crafting.done)
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

export default {
  error,
  helpDialog,
  loadingDialog,
  sortDropdown,
  splitDropdown,
  readFields
}
