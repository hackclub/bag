import { prisma } from '../../db'
import { log } from '../../logger'
import { mappedPermissionValues } from '../../permissions'
import { channels } from '../../utils'
import slack, { execute } from '../slack'
import { PermissionLevels, Item, Identity } from '@prisma/client'
import type { Block, KnownBlock, View } from '@slack/bolt'

slack.command('/item', async props => {
  await execute(props, async props => {
    const message = props.command.text.trim()

    const user = await prisma.identity.findUnique({
      where: { slack: props.context.userId }
    })

    try {
      if (message === 'create' && user.permissions === PermissionLevels.ADMIN)
        return await props.client.views.open({
          trigger_id: props.body.trigger_id,
          view: createItem
        })
      const items = await prisma.item.findMany({
        where: {
          OR: [
            {
              name: {
                equals: message.split(' ').join(' ').toLowerCase(),
                mode: 'insensitive'
              }
            },
            {
              reaction: props.body.text
            }
          ]
        }
      })

      if (!items.length) throw new Error()
      const item = items[0]
      if (user.permissions === PermissionLevels.READ && !item.public)
        throw new Error()
      if (
        mappedPermissionValues[user.permissions] <
          mappedPermissionValues.WRITE &&
        !item.public &&
        !user.specificItems.find(itemId => itemId === item.name)
      )
        throw new Error()

      return await props.respond({
        response_type: 'ephemeral',
        blocks: await getItem(item, user)
      })
    } catch {
      if (!message.length)
        return await props.respond({
          response_type: 'ephemeral',
          text: `Try running \`/item <name>\` or \`/item :-item-tag\`!`
        })
      return await props.respond({
        response_type: 'ephemeral',
        text: `Oops, couldn't find *${message.split(' ').join(' ')}*.`
      })
    }
  })
})

slack.view('create-item', async props => {
  await execute(props, async props => {
    let fields: {
      name: string
      reaction: string
      description: string
      commodity: boolean
      tradable: boolean
      public: boolean
    } = {
      name: undefined,
      reaction: undefined,
      description: undefined,
      commodity: undefined,
      tradable: undefined,
      public: undefined
    }
    for (let field of Object.values(props.view.state.values)) {
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]]?.value ||
        Object.values(field)[0].selected_option?.value ||
        ''
      if (fields[Object.keys(field)[0]] === 'true')
        fields[Object.keys(field)[0]] = true
      else if (fields[Object.keys(field)[0]] === 'false')
        fields[Object.keys(field)[0]] = false
    }

    const user = await prisma.identity.findUnique({
      where: { slack: props.context.userId }
    })
    if (user.permissions !== PermissionLevels.ADMIN) {
      // Request to create item
      await props.client.chat.postEphemeral({
        channel: user.slack,
        user: user.slack,
        text: 'Item creation request made! You should get a response sometime in the next 24 hours if today is a weekday, and 72 hours otherwise!'
      })
      await props.client.chat.postMessage({
        channel: channels.approvals,
        blocks: approveOrDenyItem(fields, props.context.userId)
      })
    } else {
      const item = await prisma.item.create({ data: fields })
      await props.client.chat.postEphemeral({
        channel: user.slack,
        user: user.slack,
        text: `Item ${item.reaction} ${item.name} created!`
      })
    }
  })
})

slack.action('approve-item', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    let { user, item: fields } = JSON.parse(props.action.value)

    // Create item, and add to user's lit of items they can access
    const item = await prisma.item.create({ data: fields })
    log('New item created: ', item.name)

    await prisma.identity.update({
      where: { slack: user },
      data: { specificItems: { push: item.name } }
    })

    await props.respond(
      `New item approved and created: ${item.reaction} ${item.name}`
    )

    await props.say({
      channel: user,
      text: `Item ${item.reaction} ${item.name} created!`
    })
  })
})

slack.action('deny-item', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    let { user, item } = JSON.parse(props.action.value)

    await props.respond(
      `Request to create ${item.reaction} ${item.name} denied.`
    )

    // @ts-expect-error
    await props.client.chat.postMessage({
      channel: user,
      text: `Your request to create ${item.reaction} ${item.name} was denied.`
    })
  })
})

slack.action('edit-item', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { name } = JSON.parse(props.action.value)

    const item = await prisma.item.findUnique({
      where: { name }
    })

    // @ts-expect-error
    await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.client.views.open({
        // @ts-expect-error
        trigger_id: props.body.trigger_id,
        view: editItem(item)
      })
    })
  })
})

slack.view('edit-item', async props => {
  await execute(props, async props => {
    let fields: {
      name: string
      description: string
      reaction: string
      commodity: boolean
      tradable: boolean
      public: boolean
    } = {
      name: '',
      description: '',
      reaction: '',
      commodity: undefined,
      tradable: undefined,
      public: undefined
    }
    for (let field of Object.values(props.view.state.values)) {
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

    const { prevName } = JSON.parse(props.view.private_metadata)

    const item = await prisma.item.update({
      where: { name: prevName },
      data: fields
    })

    await props.respond({
      response_type: 'ephemeral',
      text: `Updated *${item.name}* successfully.`
    })
  })
})

const getItem = async (
  item: Item,
  user: Identity
): Promise<(Block | KnownBlock)[]> => {
  let blocks: (Block | KnownBlock)[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Here's ${item.reaction} *${item.name}*: ${
          item.description
            ? '\n\n>' + item.description
            : '_No description provided._'
        }`
      }
    }
  ]

  // Get all recipes that lead to this item
  const recipes = await prisma.recipe.findMany({
    where: { outputs: { some: { recipeItemId: item.name, instanceId: null } } },
    include: {
      inputs: { include: { recipeItem: true } },
      tools: { include: { recipeItem: true } },
      outputs: { include: { recipeItem: true } }
    }
  })

  if (recipes.length)
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `Ways to make this:\n\n` +
          recipes
            .map(recipe => {
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
              return (
                inputs +
                (tools.length ? ' ~ ' + tools : '') +
                ' *→* ' +
                outputs +
                '\n'
              )
            })
            .join('\n')
      }
    })

  if (
    user.permissions === PermissionLevels.ADMIN ||
    (mappedPermissionValues[user.permissions] >=
      mappedPermissionValues.READ_PRIVATE &&
      user.specificItems.find(name => item.name))
  )
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Edit'
          },
          action_id: 'edit-item',
          value: JSON.stringify({ name: item.name })
        }
      ]
    })
  return blocks
}

const createItem: View = {
  callback_id: 'create-item',
  title: {
    type: 'plain_text',
    text: 'Craft item'
  },
  submit: {
    type: 'plain_text',
    text: 'Craft item'
  },
  type: 'modal',
  blocks: [
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'name',
        placeholder: {
          type: 'plain_text',
          text: 'Name of item'
        }
      },
      label: {
        type: 'plain_text',
        text: 'Name'
      }
    },
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'reaction',
        placeholder: {
          type: 'plain_text',
          text: 'Emoji',
          emoji: true
        }
      },
      label: {
        type: 'plain_text',
        text: 'Emoji'
      }
    },
    {
      type: 'input',
      optional: true,
      element: {
        type: 'plain_text_input',
        multiline: true,
        action_id: 'description',
        placeholder: {
          type: 'plain_text',
          text: "What's up with this item?"
        }
      },
      label: {
        type: 'plain_text',
        text: 'Description',
        emoji: true
      }
    },
    {
      type: 'input',
      element: {
        action_id: 'commodity',
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Commodity'
        },
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Is a commodity'
            },
            value: 'true'
          },
          {
            text: {
              type: 'plain_text',
              text: 'Is not a commodity'
            },
            value: 'false'
          }
        ]
      },
      label: {
        type: 'plain_text',
        text: 'Is this considered a common item?'
      }
    },
    {
      type: 'input',
      element: {
        action_id: 'tradable',
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Tradable'
        },
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Can be traded'
            },
            value: 'true'
          },
          {
            text: {
              type: 'plain_text',
              text: "Can't be traded"
            },
            value: 'false'
          }
        ]
      },
      label: {
        type: 'plain_text',
        text: 'Is this item tradable?'
      }
    },
    {
      type: 'input',
      element: {
        action_id: 'public',
        type: 'static_select',
        placeholder: {
          type: 'plain_text',
          text: 'Public'
        },
        options: [
          {
            text: {
              type: 'plain_text',
              text: 'Is public'
            },
            value: 'true'
          },
          {
            text: {
              type: 'plain_text',
              text: 'Is private'
            },
            value: 'false'
          }
        ]
      },
      label: {
        type: 'plain_text',
        text: '(Can be viewed by everyone)'
      }
    }
  ]
}

const approveOrDenyItem = (
  item: {
    name: string
    reaction: string
    description: string
    commodity: boolean
    tradable: boolean
    public: boolean
  },
  user: string
): (Block | KnownBlock)[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${user}> just requested the creation of ${item.reaction} ${item.name}.

>${item.description}

Approve or deny:`
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          style: 'primary',
          text: {
            type: 'plain_text',
            text: 'Approve and create'
          },
          value: JSON.stringify({
            item,
            user
          }),
          action_id: 'approve-item'
        },
        {
          type: 'button',
          style: 'danger',
          text: {
            type: 'plain_text',
            text: 'Deny'
          },
          value: JSON.stringify({
            item,
            user
          }),
          action_id: 'deny-item'
        }
      ]
    }
  ]
}

const editItem = (item: Item): View => {
  for (let key of Object.keys(item)) if (item[key] === undefined) item[key] = ''
  return {
    callback_id: 'edit-item',
    private_metadata: JSON.stringify({
      prevName: item.name
    }),
    title: {
      type: 'plain_text',
      text: 'Edit item'
    },
    submit: {
      type: 'plain_text',
      text: 'Update item'
    },
    type: 'modal',
    blocks: [
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: 'name',
          placeholder: {
            type: 'plain_text',
            text: 'Name of item'
          },
          initial_value: item.name
        },
        label: {
          type: 'plain_text',
          text: 'Name of item'
        }
      },
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: 'reaction',
          placeholder: {
            type: 'plain_text',
            text: 'Reaction'
          },
          initial_value: item.reaction
        },
        label: {
          type: 'plain_text',
          text: 'Reaction',
          emoji: true
        }
      },
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: 'description',
          placeholder: {
            type: 'plain_text',
            text: 'Description'
          },
          initial_value: item.description,
          multiline: true
        },
        optional: true,
        label: {
          type: 'plain_text',
          text: 'What is this?',
          emoji: true
        }
      },
      {
        type: 'input',
        element: {
          action_id: 'commodity',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Commodity'
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Is a commodity'
              },
              value: 'true'
            },
            {
              text: {
                type: 'plain_text',
                text: 'Is not a commodity'
              },
              value: 'false'
            }
          ],
          initial_option: {
            text: {
              type: 'plain_text',
              text: item.commodity ? 'Is a commodity' : 'Is not a commodity'
            },
            value: item.commodity ? 'true' : 'false'
          }
        },
        label: {
          type: 'plain_text',
          text: 'Is this item a commodity?'
        }
      },
      {
        type: 'input',
        element: {
          action_id: 'tradable',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Tradable'
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Can be traded',
                emoji: true
              },
              value: 'true'
            },
            {
              text: {
                type: 'plain_text',
                text: "Can't be traded",
                emoji: true
              },
              value: 'false'
            }
          ],
          initial_option: {
            text: {
              type: 'plain_text',
              text: item.tradable ? 'Can be traded' : "Can't be traded"
            },
            value: item.tradable ? 'true' : 'false'
          }
        },
        label: {
          type: 'plain_text',
          text: 'Is this item tradable?'
        }
      },
      {
        type: 'input',
        element: {
          action_id: 'public',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Public'
          },
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Is public'
              },
              value: 'true'
            },
            {
              text: {
                type: 'plain_text',
                text: 'Is private'
              },
              value: 'false'
            }
          ],
          initial_option: {
            text: {
              type: 'plain_text',
              text: item.public ? 'Is public' : 'Is private'
            },
            value: item.public ? 'true' : 'false'
          }
        },
        label: {
          type: 'plain_text',
          text: '(Can be viewed by everyone)'
        }
      }
    ]
  }
}
