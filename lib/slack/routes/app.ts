import { findOrCreateIdentity, prisma } from '../../db'
import { mappedPermissionValues } from '../../permissions'
import { channels, getKeyByValue, inMaintainers } from '../../utils'
import slack, { execute } from '../slack'
import { cascadingPermissions } from '../views'
import views from '../views'
import { App, PermissionLevels } from '@prisma/client'
import { Block, KnownBlock, View, PlainTextOption } from '@slack/bolt'
import { v4 as uuid } from 'uuid'

slack.command('/huh', async props => {
  await execute(props, async props => {
    if (!inMaintainers(props.context.userId))
      return props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: "You found something, but it's not ready yet."
      })

    const message = props.command.text.trim().split(' ')
    try {
      if (message.length == 2) {
        // Check app and key
        const app = await prisma.app.findUnique({
          where: {
            id: Number(message[0]),
            key: message[1]
          }
        })
        if (!app) throw new Error()
        return await props.client.views.open({
          trigger_id: props.body.trigger_id,
          view: editApp(app)
        })
      }
    } catch {
      const user = await findOrCreateIdentity(props.context.userId)

      // Search by name instead
      const app = await prisma.app.findFirst({
        where: {
          name: {
            equals: message.join(' ').toLowerCase(),
            mode: 'insensitive'
          }
        }
      })

      if (
        !app ||
        (mappedPermissionValues[user.permissions] <
          mappedPermissionValues.ADMIN &&
          !app.public &&
          !user.specificApps.find(appId => appId === app.id))
      )
        return await props.respond({
          response_type: 'ephemeral',
          text: `Oops, couldn't find an app named *${message.join(' ')}*.`
        })

      return await props.respond({
        response_type: 'ephemeral',
        blocks: getApp(app)
      })
    }

    return await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: createApp(
        inMaintainers(props.context.userId)
          ? PermissionLevels.ADMIN
          : PermissionLevels.READ
      )
    })
  })
})

// TODO: Should allow existing apps to give permissions to new apps through some sort of visual interface

slack.view('create-app', async props => {
  await execute(props, async props => {
    let fields: {
      name: string
      description: string
      public: boolean
      permissions: PermissionLevels
    } = {
      name: '',
      description: '',
      public: false,
      permissions: undefined
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

    // Make sure app doesn't exist yet
    if (await prisma.app.findUnique({ where: { name: fields.name } }))
      return await props.client.chat.postEphemeral({
        channel: props.context.userId,
        user: props.context.userId,
        text: 'Name is already being used.'
      })

    // Create app
    const app = await prisma.app.create({
      data: {
        name: fields.name,
        key: uuid(),
        description: fields.description,
        permissions: fields.permissions,
        public: fields.public
      }
    })

    return await props.client.chat.postMessage({
      channel: props.context.userId,
      blocks: createdApp(app)
    })
  })
})

slack.view('edit-app', async props => {
  await execute(props, async props => {
    let fields: {
      'name': string
      'description': string
      'public': boolean
      'permissions': PermissionLevels
      'delete-app': string
    } = {
      'name': '',
      'description': '',
      'public': false,
      'permissions': undefined,
      'delete-app': undefined
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

    console.log(fields)

    const { prevName } = JSON.parse(props.view.private_metadata)

    if (fields['delete-app']) {
      // Send user notification that their app was deleted
      let app = await prisma.app.findUnique({
        where: {
          name: prevName,
          key: fields['delete-app']
        }
      })
      if (!app)
        return await props.respond({
          response_type: 'ephemeral',
          text: `Unable to delete *${app.name}* - you provided the wrong key.`
        })
      await prisma.app.delete({
        where: {
          name: prevName,
          key: fields['delete-app']
        }
      })
      return await props.client.chat.postMessage({
        channel: props.context.userId,
        user: props.context.userId,
        text: `Deleted *${app.name}*.`
      })
    }

    let app = await prisma.app.findUnique({
      where: { name: prevName }
    })

    // Request permissions if changed
    if (
      mappedPermissionValues[app.permissions] >
      mappedPermissionValues[fields.permissions]
    )
      // Give downgrade without permissions
      await prisma.app.update({
        where: { name: prevName },
        data: { permissions: fields.permissions }
      })
    else if (app.permissions !== fields.permissions)
      await props.client.chat.postMessage({
        channel: channels.approvals,
        blocks: approveOrDenyAppPerms(
          props.context.userId,
          app,
          fields.permissions as PermissionLevels
        )
      })

    delete fields.permissions
    app = await prisma.app.update({
      where: { name: prevName },
      data: fields
    })
    await props.client.chat.postEphemeral({
      channel: props.context.userId,
      user: props.context.userId,
      text: `Updated *${app.name}* successfully.`
    })
  })
})

slack.action('app-approve-perms', async props => {
  await execute(props, async props => {
    let {
      app: appId,
      user: userId,
      permissions
      // @ts-expect-error
    } = JSON.parse(props.action.value)
    permissions = getKeyByValue(mappedPermissionValues, permissions)

    await prisma.app.update({
      where: { id: appId },
      data: { permissions: permissions as PermissionLevels }
    })
    await props.respond(`${permissions} for app *${appId}* approved.`)

    // Let user know
    // @ts-expect-error
    await props.client.chat.postMessage({
      channel: userId,
      text: `Your request to update *${appId}*'s permissions to ${permissions} was approved!`
    })
  })
})

slack.action('app-deny-perms', async props => {
  // @ts-expect-error
  let { app: appId, user: userId, permissions } = JSON.parse(props.action.value)
  permissions = getKeyByValue(mappedPermissionValues, permissions)

  await props.respond(`${permissions} for app *${appId}* denied.`)

  await props.client.chat.postMessage({
    channel: userId,
    text: `Your request to update *${appId}*'s permissions to ${permissions} was rejected.`
  })
})

const approveOrDenyAppPerms = (
  user: string,
  app: App,
  permissions: PermissionLevels
): (Block | KnownBlock)[] => [
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
          user,
          app: app.id,
          permissions
        }),
        action_id: 'app-approve-perms'
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
          app: app.id,
          permissions
        }),
        action_id: 'app-deny-perms'
      }
    ]
  }
]

const editApp = (app: App): View => ({
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
          text: 'Request permissions',
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
})

const getApp = (app: App): (Block | KnownBlock)[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Here's *${app.name}*:
      
>_${app.description}_`
    }
  }
]

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
        }\n\nTo edit your app/request a permission level, run \`/app ${
          app.id
        } ${app.key}\`.`
      }
    }
  ]
}

const createApp = (permission: PermissionLevels): View => ({
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
})
