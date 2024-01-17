import {
  PrismaClient,
  App,
  Identity,
  Instance,
  PermissionLevels,
  Item,
  Trade
} from '@prisma/client'
import { View, PlainTextOption, Block, KnownBlock } from '@slack/bolt'
import { type IdentityWithInventory } from '../db'
import { mappedPermissionValues } from '../permissions'
import config from '../../config'

const prisma = new PrismaClient()

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

const cascadingPermissions = [
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

const createApp = (permission: PermissionLevels): View => {
  return {
    callback_id: 'create-app',
    title: {
      type: 'plain_text',
      text: 'Create app'
    },
    submit: {
      type: 'plain_text',
      text: 'Create app'
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
          }
        },
        label: {
          type: 'plain_text',
          text: 'Name'
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
            text: "What's up with this app?"
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
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Permission',
            emoji: true
          },
          options: cascadingPermissions.slice(
            0,
            mappedPermissionValues[permission] + 1
          ) as Array<PlainTextOption>,
          action_id: 'permissions'
        },
        label: {
          type: 'plain_text',
          text: 'Select a permission level',
          emoji: true
        }
      }
    ]
  }
}

const editApp = (app: App): View => {
  return {
    callback_id: 'edit-app',
    private_metadata: JSON.stringify({
      prevName: app.name
    }),
    title: {
      type: 'plain_text',
      text: 'Edit app'
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
          initial_value: app.name
        },
        label: {
          type: 'plain_text',
          text: 'App name',
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
          initial_value: app.description,
          multiline: true
        },
        label: {
          type: 'plain_text',
          text: 'What does this do?',
          emoji: true
        }
      },
      {
        type: 'input',
        element: {
          type: 'radio_buttons',
          options: [
            {
              text: {
                type: 'plain_text',
                text: 'Public'
              },
              value: 'true'
            },
            {
              text: {
                type: 'plain_text',
                text: 'Private'
              },
              value: 'false'
            }
          ],
          action_id: 'public',
          initial_option: {
            text: {
              type: 'plain_text',
              text: app.public ? 'Public' : 'Private'
            },
            value: app.public ? 'true' : 'false'
          }
        },
        label: {
          type: 'plain_text',
          text: 'Visibility'
        }
      },
      {
        type: 'input',
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Request permissons',
            emoji: true
          },
          options: cascadingPermissions as Array<PlainTextOption>,
          action_id: 'permissions',
          initial_option: cascadingPermissions[
            mappedPermissionValues[app.permissions]
          ] as PlainTextOption
        },
        label: {
          type: 'plain_text',
          text: 'Select a permission level',
          emoji: true
        }
      },
      {
        type: 'input',
        element: {
          type: 'plain_text_input',
          action_id: 'delete-app',
          placeholder: {
            type: 'plain_text',
            text: 'App key'
          }
        },
        label: {
          type: 'plain_text',
          text: 'Delete app'
        },
        optional: true,
        hint: {
          type: 'plain_text',
          text: 'This will permanently delete your app, but not associated data, e.g. instances created! Please make sure this is what you want to do.'
        }
      }
    ]
  }
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

const getApp = (app: App): (Block | KnownBlock)[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Here's *${app.name}*:

>_${app.description}_

ID: ${app.id}
Permissions: ${app.permissions}
Public: ${app.public}
Metadata: \`${
          app.metadata === null || !Object.keys(app.metadata).length
            ? '{}'
            : app.metadata
        }\``
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

Is this a commodity? ${item.commodity ? 'Yes' : 'No'}
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

const createdApp = (app: App): (Block | KnownBlock)[] => {
  const permissionDesc = {
    ADMIN:
      'do everything, including creating, reading, updating, and deleting everything.',
    WRITE: 'read and update everything.',
    WRITE_SPECIFIC: 'read and write specific inventory items.',
    READ_PRIVATE:
      'read inventory items, including private ones the app has access to.',
    READ: 'read public inventory items.'
  }
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${app.name}* created, your app token is \`${
          app.key
        }\`. (Don't share it with anyone unless they're also working on the app!) Your app can: ${
          permissionDesc[app.permissions]
        }\n\nTo edit your app/request a permission level, run \`/edit-app ${
          app.id
        } ${app.key}\``
      }
    }
  ]
}

const requestPerms = (user: Identity): View => {
  return {
    callback_id: 'user-request-perms',
    title: {
      type: 'plain_text',
      text: 'Request permissions'
    },
    submit: {
      type: 'plain_text',
      text: 'Request permissons'
    },
    type: 'modal',
    blocks: [
      {
        type: 'input',
        element: {
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Permission'
          },
          options: cascadingPermissions as Array<PlainTextOption>,
          action_id: 'permissions'
        },
        label: {
          type: 'plain_text',
          text: 'Select a personal permission level',
          emoji: true
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

const approveOrDenyPerms = (
  user: string,
  permissions: PermissionLevels
): (Block | KnownBlock)[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${user}> just asked for ${permissions} permissions. Accept or deny:`
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
            text: 'Approve'
          },
          value: JSON.stringify({
            user,
            permissions: mappedPermissionValues[permissions]
          }),
          action_id: 'user-approve-perms'
        },
        {
          type: 'button',
          style: 'danger',
          text: {
            type: 'plain_text',
            text: 'Deny'
          },
          value: JSON.stringify({
            user,
            permissions: mappedPermissionValues[permissions]
          }),
          action_id: 'user-deny-perms'
        }
      ]
    }
  ]
}

const approveOrDenyAppPerms = (
  app: App,
  permissions: PermissionLevels
): (Block | KnownBlock)[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${app.name} (an app) just asked for ${permissions} permissions. Accept or deny:`
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
            text: 'Approve'
          },
          value: JSON.stringify({
            app: app.id,
            permissions
          }),
          action_id: 'approve-app-perms'
        },
        {
          type: 'button',
          style: 'danger',
          text: {
            type: 'plain_text',
            text: 'Deny'
          },
          value: JSON.stringify({
            app: app.id,
            permissions
          }),
          action_id: 'deny-app-perms'
        }
      ]
    }
  ]
}

const helpDialog: (Block | KnownBlock)[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Hi! I am a bag. Here's a list of available commands.

\`/bag-item\`: Lets you create an item, if you're an admin. (I know, I know, but we have to have rules somewhere.)
\`/bag-app\`: Lets you create an app. Most apps will, by default, start out in readonly public mode, and be private by default. You'll receive a DM from @bag with your app key, as well as the ability to edit app settings.
\`/bag-perms\`: Request permissions for yourself. 
\`/edit-app <id> <key>\`: Lets you edit an app and its settings, given you have the key.
\`/get-app <name>\`: Lets you get info about an app, including its ID, given its name.
\`/inventory me/@<person>\`: Same functionality as mentioning me, but you can also do this in DMs! 

And of course, if you ever mention me, the @bag, I will help in any way possible! (Although I am just a measly bag.) Here is a list of things you can call me for:

* \`help\`: Call me for help!
* \`me\`: Check out your inventory! This will list all public items. You can also list private items with \`me private\` instead.
* \`@<person>\`: Check out another Hack Clubber's inventory! This will list all their public items.

By the way, I come with a bunch of ~magic tricks~ apps! You can check out all the (public) apps by calling \`/bag-apps\`. *Interested in writing an app? Check out this super cool jam!*`
    }
  }
]

// TODO: Add button to view more info about each inventory item
const showInventory = async (
  user: IdentityWithInventory
): Promise<(Block | KnownBlock)[]> => {
  const formatInventory = async (inventory: Instance[]): Promise<string> => {
    let result: string[] = []
    // for (let item of inventory) {
    //   const ref = await prisma.item.findUnique({
    //     where: {
    //       name: item.itemId
    //     }
    //   })
    //   result.push(`x${item.quantity} ${ref.reaction}: ${ref.name}`)
    // }
    const reduced = inventory.reduce((acc: any, curr: Instance) => {
      const instance = acc.find(instances => instances[0].itemId == curr.itemId)
      if (instance) instance.push(curr)
      else acc.push([curr])
      return acc
    }, [])
    for (let instances of reduced) {
      const ref = await prisma.item.findUnique({
        where: {
          name: instances[0].itemId
        }
      })
      const quantity = instances.reduce((acc: any, curr: Instance) => {
        return acc + curr.quantity
      }, 0)
      result.push(`x${quantity} ${ref.reaction} ${ref.name}`)
    }
    return result.join('\n')
  }

  let text = []
  if (user.permissions === 'ADMIN')
    text.push(`<@${user.slack}> is an admin and has:`)
  else text.push(`<@${user.slack}> has:`)

  if (!user.inventory.length)
    text.push(
      ' nothing. Nothing? The bag is empty? Are you sure? Time to go out and do some stuff.'
    )
  else text.push('\n' + (await formatInventory(user.inventory)))

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: text.join('')
      }
    }
  ]
}

const startTrade = (
  initiator: string,
  receiver: string,
  trade: Trade
): (Block | KnownBlock)[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<@${initiator}> just opened a trade with <@${receiver}>.\n\n Add and remove items; once you're satisfied, click on the "Close trade" button to close the trade. Once both sides close the trade, the transfer will be made.`
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Add from inventory'
          },
          style: 'primary',
          value: trade.id.toString(),
          action_id: 'update-trade'
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Close trade',
            emoji: true
          },
          style: 'danger',
          value: trade.id.toString(),
          action_id: 'close-thread'
        }
      ]
    }
  ]
}

const tradeDialog = (user: IdentityWithInventory): View => {
  return {
    callback_id: 'add-trade',
    title: {
      type: 'plain_text',
      text: 'Add from inventory'
    },
    submit: {
      type: 'plain_text',
      text: 'Offer'
    },
    type: 'modal',
    blocks: []
  }
}

export default {
  error,
  createItem,
  createApp,
  createdApp,
  editApp,
  editItem,
  getApp,
  getItem,
  requestPerms,
  approveOrDenyItem,
  approveOrDenyPerms,
  approveOrDenyAppPerms,
  helpDialog,
  showInventory,
  startTrade,
  tradeDialog
}
