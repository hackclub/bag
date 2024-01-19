import { log } from '../../logger'
import { mappedPermissionValues } from '../../permissions'
import { channels } from '../../utils'
import slack, { execute } from '../slack'
import { PrismaClient, PermissionLevels, Item } from '@prisma/client'
import { Block, KnownBlock, View } from '@slack/bolt'

const prisma = new PrismaClient()

slack.command('/bag-item', async props => {
  await execute(props, async (props, permission) => {
    const message = props.command.text
    const command = message.split(' ')[0]

    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      }
    })

    switch (command) {
      case 'list':
        let items = await prisma.item.findMany()
        if (permission < mappedPermissionValues.READ_PRIVATE)
          items = items.filter(item => item.public)
        else if (permission < mappedPermissionValues.WRITE)
          items = items.filter(
            item =>
              item.public ||
              user.specificItems.find(itemId => itemId === item.name)
          )
        const formatted = items.map(item => getItem(item))
        return await props.client.chat.postMessage({
          channel: props.body.channel_id,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Here's a list of all the ${
                  permission < mappedPermissionValues.READ_PRIVATE
                    ? 'public '
                    : ''
                }items currently in the bag:`
              }
            },
            ...formatted.map(itemBlock => itemBlock[0]),
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: "If you'd like to snap your fingers like Thanos and suggest an item to be added to the bag, you can run `/bag-item create`!"
              }
            }
          ]
        })
      case 'search':
        try {
          const query = message.split(' ').slice(1).join('')
          if (query[0] !== '`' || query[query.length - 1] !== '`')
            throw new Error()
          let items = await prisma.item.findMany({
            where: JSON.parse(query.slice(1, query.length - 1))
          })
          if (!items.length) throw new Error()

          if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.READ_PRIVATE
          )
            items = items.filter(item => item.public)
          if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.WRITE
          )
            items = items.filter(
              item =>
                item.public ||
                user.specificItems.find(itemId => itemId === item.name)
            )

          const formatted = items.map(item => getItem(item))
          return await props.client.chat.postMessage({
            channel: props.body.channel_id,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `Here's a list of all the items in the bag that match ${query}:`
                }
              },
              ...formatted.map(itemBlock => itemBlock[0])
            ]
          })
        } catch {
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            text: "Oh no! Couldn't find any items matching your query. Make sure your query is properly formatted - that is, a valid JSON query encased in a `code snippet`."
          })
        }
      case 'edit':
        try {
          const name = message.split(' ')[1]
          const item = await prisma.item.findUnique({
            where: {
              name
            }
          })

          if (!item) throw new Error()
          if (
            mappedPermissionValues[user.permissions] <
            mappedPermissionValues.WRITE_SPECIFIC
          )
            throw new Error()
          if (
            user.permissions === PermissionLevels.WRITE_SPECIFIC &&
            !user.specificItems.find(itemId => itemId === item.name)
          )
            throw new Error()

          await props.client.views.open({
            trigger_id: props.body.trigger_id,
            view: editItem(item)
          })
        } catch {
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            text: "Oh no! To edit an item you'll need to provide the name of the item and have the appropriate permissions."
          })
        }
        break
      case 'create':
        // If admin, form directly creates item; otherwise, it opens a request to maintainers
        return await props.client.views.open({
          trigger_id: props.body.trigger_id,
          view: createItem
        })
      default:
        // Either list item, or if no message is provided, show options
        if (message === '') {
          // List options
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            blocks: itemDialog
          })
        } else {
          try {
            const item = await prisma.item.findUnique({
              where: {
                name: props.command.text
              }
            })

            if (!item) throw new Error()
            if (user.permissions === PermissionLevels.READ && !item.public)
              throw new Error()
            if (
              mappedPermissionValues[user.permissions] <
                mappedPermissionValues.WRITE &&
              !item.public &&
              !user.specificItems.find(itemId => itemId === item.name)
            )
              throw new Error()

            return await props.client.chat.postMessage({
              channel: props.body.channel_id,
              user: props.context.userId,
              blocks: getItem(item)
            })
          } catch {
            return await props.client.chat.postEphemeral({
              channel: props.body.channel_id,
              user: props.context.userId,
              text: `Oops, couldn't find a item named *${message}*.`
            })
          }
        }
    }
  })
})

slack.action('get-item', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const item = JSON.parse(props.action.value)
    return props.say({
      // TODO: Post in thread
      blocks: getItem(item)
    })
  })
})

slack.view('edit-item', async props => {
  await execute(props, async props => {
    let fields: {
      name: string
      image: string
      description: string
      reaction: string
      commodity: boolean
      tradable: boolean
      public: boolean
    } = {
      name: undefined,
      image: undefined,
      description: undefined,
      reaction: undefined,
      commodity: undefined,
      tradable: undefined,
      public: undefined
    }
    for (let field of Object.values(props.view.state.values)) {
      if (field[Object.keys(field)[0]].value === null) continue
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]].value ||
        Object.values(field)[0].selected_option.value ||
        ''
      if (fields[Object.keys(field)[0]] === 'true')
        fields[Object.keys(field)[0]] = true
      else if (fields[Object.keys(field)[0]] === 'false')
        fields[Object.keys(field)[0]] = false
    }

    const { prevName } = JSON.parse(props.view.private_metadata)

    const item = await prisma.item.update({
      where: {
        name: prevName
      },
      data: fields
    })

    await props.client.chat.postMessage({
      channel: props.context.userId,
      user: props.context.userId,
      text: `Updated *${item.name}* successfully.`
    })
  })
})

slack.view('create-item', async props => {
  await execute(
    props,
    async props => {
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
          field[Object.keys(field)[0]].value ||
          Object.values(field)[0].selected_option.value ||
          ''
        if (fields[Object.keys(field)[0]] === 'true')
          fields[Object.keys(field)[0]] = true
        else if (fields[Object.keys(field)[0]] === 'false')
          fields[Object.keys(field)[0]] = false
      }

      const user = await prisma.identity.findUnique({
        where: {
          slack: props.context.userId
        }
      })
      if (user.permissions !== PermissionLevels.ADMIN) {
        // Request to create item
        await props.client.chat.postMessage({
          channel: user.slack,
          text: 'Item creation request made! You should get a response sometime in the next 24 hours if today is a weekday, and 72 hours otherwise!'
        })
        return await props.client.chat.postMessage({
          channel: channels.approvals,
          blocks: approveOrDenyItem(fields, props.context.userId)
        })
      }

      // Create item
      const item = await prisma.item.create({
        data: fields
      })
      log('New item created: ', item.name)
      await props.client.chat.postMessage({
        channel: props.context.userId,
        user: props.context.userId,
        text: `New item created: ${item.name} ${item.reaction}`
      })
    },
    mappedPermissionValues.ADMIN
  )
})

slack.action('approve-item', async props => {
  await execute(props, async props => {
    try {
      // @ts-expect-error
      let { user, item: fields } = JSON.parse(props.action.value)

      // Create item, and add to user's list of items they can access
      const item = await prisma.item.create({
        data: fields
      })
      log('New item created: ', item.name)

      await prisma.identity.update({
        where: {
          slack: user
        },
        data: {
          specificItems: { push: item.name }
        }
      })

      // @ts-expect-error
      await props.client.chat.postMessage({
        channel: user,
        user,
        text: `New item approved and created: ${item.name} ${item.reaction}`
      })
    } catch {
      await props.say('Already applied.')
    }
  })
})

slack.action('deny-item', async props => {
  await execute(props, async props => {
    try {
      // @ts-expect-error
      let { user, item } = JSON.parse(props.action.value)

      // @ts-expect-error
      await props.client.chat.postMessage({
        channel: user,
        text: `Your request to create ${item.name} ${item.reaction} was denied.`
      })
    } catch {
      return await props.say('Already applied.')
    }
  })
})

// TODO: Should allow existing items to give permissions to new apps

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
        text: 'Name',
        emoji: true
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
        text: 'Emoji',
        emoji: true
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

const getItem = (item: Item): (Block | KnownBlock)[] => {
  console.log(item)
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Here's ${item.reaction} *${item.name}*:

>_${item.description}_

Commodity: ${item.commodity ? 'Yes' : 'No'}
Tradable: ${item.tradable ? 'Yes' : 'No'}
Public: ${item.public ? 'Yes' : 'No'}
Metadata: \`${
          item.metadata === null || !Object.keys(item.metadata).length
            ? '{}'
            : item.metadata
        }\`        `
      }
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
      text: 'Update app'
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
            text: 'Name of app'
          },
          initial_value: item.name
        },
        label: {
          type: 'plain_text',
          text: 'Name of app'
        }
      },
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: 'image',
          placeholder: {
            type: 'plain_text',
            text: 'Link to image'
          },
          initial_value: item.image || ''
        },
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Image'
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
        label: {
          type: 'plain_text',
          text: 'What is this?',
          emoji: true
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
        text: ''
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

// TODO
const itemDialog: (Block | KnownBlock)[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Options for \`bag-item\`:`
    }
  }
]
