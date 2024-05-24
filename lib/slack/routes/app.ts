import { log } from '../../analytics'
import { findOrCreateIdentity, prisma } from '../../db'
import { mappedPermissionValues } from '../../permissions'
import { channels, inMaintainers } from '../../utils'
import slack, { execute } from '../slack'
import { cascadingPermissions } from '../views'
import views from '../views'
import { App, Identity, PermissionLevels } from '@prisma/client'
import type {
  Block,
  KnownBlock,
  View,
  PlainTextOption,
  ActionsBlock
} from '@slack/bolt'
import { v4 as uuid } from 'uuid'

slack.command('/rlb-bot', async props => {
  await execute(props, async props => {
    await log('slack-app', `${props.context.userId}-${Date.now()}`, {
      channel: props.body.channel_id,
      user: (await props.client.users.info({ user: props.context.userId }))
        .user,
      command: `/rlb-bot ${props.command.text}`
    })

    const message = props.command.text.trim()
    if (message.length) {
      const user = await findOrCreateIdentity(props.context.userId)

      const app = await prisma.app.findFirst({
        where: {
          name: {
            equals: message.toLowerCase(),
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
          text: `Oops, couldn't find an app named *${message}*.`
        })

      return await props.respond({
        response_type: 'ephemeral',
        blocks: getApp(app, user)
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

slack.view('create-app', async props => {
  await execute(props, async props => {
    let fields: {
      name: string
      description: string
      public: boolean
      permissions: PermissionLevels
    } = views.readFields(props.view.state.values)

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

    // Add to user's specificApps list
    await prisma.identity.update({
      where: { slack: props.context.userId },
      data: {
        specificApps: { push: app.id }
      }
    })

    return await props.client.chat.postMessage({
      channel: props.context.userId,
      blocks: privateApp(app)
    })
  })
})

slack.action('edit-app', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { app: appId } = JSON.parse(props.action.value)
    // @ts-expect-error
    return await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.body.trigger_id,
      view: editApp(await prisma.app.findUnique({ where: { id: appId } }))
    })
  })
})

slack.view('edit-app', async props => {
  await execute(props, async props => {
    let fields: {
      name: string
      description: string
      public: boolean
      permissions: PermissionLevels
    } = views.readFields(props.view.state.values)

    const { prevName } = JSON.parse(props.view.private_metadata)

    const app = await prisma.app.findUnique({ where: { name: prevName } })

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
    else if (app.permissions !== fields.permissions) {
      await props.client.chat.postEphemeral({
        channel: props.context.userId,
        user: props.context.userId,
        text: `App permission request made for *${app.name}*! You should get a response sometime in the next 24 hours if today is a weekday, and 72 hours otherwise!`
      })
      await props.client.chat.postMessage({
        channel: channels.approvals,
        blocks: approveOrDeny(props.context.userId, app, fields.permissions)
      })
    }

    delete fields.permissions
    const updated = await prisma.app.update({
      where: { name: prevName },
      data: fields
    })
    await props.client.chat.postEphemeral({
      channel: props.context.userId,
      user: props.context.userId,
      text: `Updated *${updated.name}* successfully.`
    })
  })
})

slack.action('approve-perms', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    let { id, user, permissions } = JSON.parse(props.action.value)

    const updated = await prisma.app.update({
      where: { id },
      data: { permissions }
    })

    await props.respond(`${permissions} for app *${updated.name}* approved.`)

    // @ts-expect-error
    await props.client.chat.postMessage({
      channel: user,
      text: `Your request to update *${updated.name}*'s permissions to ${permissions} was approved!`
    })
  })
})

slack.action('deny-perms', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    let { app, user, permissions } = JSON.parse(props.action.value)

    await props.respond(`${permissions} permissions for app *${app}* denied.`)

    // @ts-expect-error
    await props.client.chat.postMessage({
      channel: user,
      text: `Your request to update *${app}*'s permissions to ${permissions} was rejected.`
    })
  })
})

slack.action('edit-specific-perms', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { id } = JSON.parse(props.action.value)
    // @ts-expect-error
    return await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.body.trigger_id,
      view: await editSpecificPermissions(
        await prisma.app.findUnique({ where: { id } })
      )
    })
  })
})

slack.view('request-specific-perms', async props => {
  await execute(props, async props => {
    const { id } = JSON.parse(props.view.private_metadata)

    let fields: any = {}
    for (let field of Object.values(props.view.state.values)) {
      if (Object.keys(field).includes('users'))
        fields.users = field.users.selected_users
      else
        fields[Object.keys(field)[0]] = Object.values(
          field
        )[0].selected_options.map(option => option.value)
    }

    // Specific items
    let specificItems = [
      ...Object.keys(fields)
        .filter(key => key.startsWith('items'))
        .map(key => fields[key])
    ].flat()

    const app = await prisma.app.findUnique({ where: { id } })

    await props.client.chat.postEphemeral({
      channel: props.context.userId,
      user: props.context.userId,
      text: `Specific permission request made for *${app.name}*! You should get a response sometime in the next 24 hours if today is a weekday, and 72 hours otherwise!`
    })

    await props.client.chat.postMessage({
      channel: channels.approvals,
      blocks: await approveOrDenySpecific(props.context.userId, app, {
        specificItems,
        specificUsers: fields.users
      })
    })
  })
})

slack.action('approve-specific-perms', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    let { id, user, options } = JSON.parse(props.action.value)

    const updated = await prisma.app.update({
      where: { id: id },
      data: { specificItems: options.specificItems }
    })

    const users = await prisma.identity.findMany({
      where: { specificApps: { has: id } }
    })

    if (options.specificUsers)
      for (let user of options.specificUsers) {
        const search = users.findIndex(prev => prev.slack === user)
        if (search < 0)
          await prisma.identity.update({
            where: { slack: user },
            data: { specificApps: { push: id } }
          })
        else users.splice(search, 1)
      }

    for (let remove of users)
      await prisma.identity.update({
        where: { slack: remove.slack },
        data: { specificApps: remove.specificApps.filter(app => app !== id) }
      })

    await props.respond(
      `Specific permissions for app *${updated.name}* approved.`
    )

    // @ts-expect-error
    await props.client.chat.postMessage({
      channel: user,
      text: `Your request to update *${updated.name}*'s ${updated.permissions} permissions was approved!`
    })
  })
})

slack.action('deny-specific-perms', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    let { app, user } = JSON.parse(props.action.value)

    await props.respond(`Specific permissions for app *${app}* denied.`)

    // @ts-expect-error
    await props.client.chat.postMessage({
      channel: user,
      text: `Your request to update specific permissions for *${app}* was rejected.`
    })
  })
})

slack.action('delete-app-confirmation', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { id } = JSON.parse(props.action.value)
    // @ts-expect-error
    return await props.client.views.open({
      // @ts-expect-error
      trigger_id: props.body.trigger_id,
      view: deleteApp(await prisma.app.findUnique({ where: { id } }))
    })
  })
})

slack.view('delete-app', async props => {
  await execute(props, async props => {
    const { id } = JSON.parse(props.view.private_metadata)
    const key = Object.values(props.view.state.values)[0].key.value
    const app = await prisma.app.delete({
      where: { id, key }
    })
    if (!app)
      return await props.client.chat.postEphemeral({
        channel: props.context.userId,
        user: props.context.userId,
        text: `*${app.name}* couldn't be deleted because the wrong app key was given.`
      })
    return await props.client.chat.postEphemeral({
      channel: props.context.userId,
      user: props.context.userId,
      text: `*${app.name}* deleted.`
    })
  })
})

slack.action('regenerate-token', async props => {
  await execute(props, async props => {
    // @ts-expect-error
    const { id } = JSON.parse(props.action.value)
    const updated = await prisma.app.update({
      where: { id },
      data: { key: uuid() }
    })
    // @ts-expect-error
    return await props.client.chat.postMessage({
      channel: props.body.user.id,
      user: props.body.user.id,
      blocks: privateApp(updated, 'token regenerated')
    })
  })
})

const deleteApp = (app: App): View => ({
  callback_id: 'delete-app',
  title: {
    type: 'plain_text',
    text: 'Delete app'
  },
  private_metadata: JSON.stringify({ id: app.id }),
  submit: {
    type: 'plain_text',
    text: 'Confirm'
  },
  type: 'modal',
  blocks: [
    {
      type: 'input',
      element: {
        type: 'plain_text_input',
        action_id: 'key',
        placeholder: {
          type: 'plain_text',
          text: 'App key'
        }
      },
      label: {
        type: 'plain_text',
        text: 'Delete app'
      },
      hint: {
        type: 'plain_text',
        text: 'This will permanently delete your app, but not associated data, e.g. instances created! Please make sure this is what you want to do.'
      }
    }
  ]
})

const approveOrDenySpecific = async (
  user: string,
  app: App,
  options: {
    specificItems: string[]
    specificUsers: string[]
  }
): Promise<(Block | KnownBlock)[]> => {
  const items = await Promise.all(
    options.specificItems.map(async name => {
      const item = await prisma.item.findUnique({ where: { name } })
      return `${item.reaction} ${item.name}`
    })
  )
  const users = options.specificUsers.map(user => `<@${user}>`)
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${app.name}* (an app) just asked for ${
          app.permissions
        } permissions to the following:\n\n*Items*: ${items.join(
          ', '
        )}\n\n*Users*: ${users.join(', ')}\n\nApprove or deny:`
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
            id: app.id,
            options
          }),
          action_id: 'approve-specific-perms'
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
            app: app.name
          }),
          action_id: 'deny-specific-perms'
        }
      ]
    }
  ]
}

const editSpecificPermissions = async (app: App): Promise<View> => {
  // TODO: specificRecipes, way to give other apps permission to this app
  const items = await prisma.item.findMany({ where: { public: true } })
  const users = (
    await prisma.identity.findMany({
      where: {
        specificApps: { has: app.id }
      }
    })
  ).map(user => user.slack)
  return {
    callback_id: 'request-specific-perms',
    private_metadata: JSON.stringify({ id: app.id }),
    title: {
      type: 'plain_text',
      text: 'Request permissions'
    },
    submit: {
      type: 'plain_text',
      text: 'Request'
    },
    type: 'modal',
    blocks: [
      ...views.splitDropdown(
        items.map(item => ({
          text: {
            type: 'plain_text',
            text: `${item.reaction} ${item.name}`
          },
          value: item.name
        })),
        items
          .filter(item => app.specificItems.find(name => item.name === name))
          .map(item => ({
            text: {
              type: 'plain_text',
              text: `${item.reaction} ${item.name}`
            },
            value: item.name
          })),
        {
          action_id: 'items',
          type: 'multi_static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Request permissions to edit items'
          }
        },
        {
          label: { type: 'plain_text', text: 'Specific items' },
          optional: true
        }
      ),
      {
        type: 'input',
        element: {
          type: 'multi_users_select',
          placeholder: {
            type: 'plain_text',
            text: 'Specific users'
          },
          action_id: 'users',
          initial_users: users
        },
        optional: true,
        label: {
          type: 'plain_text',
          text: 'Specific users',
          emoji: true
        },
        hint: {
          type: 'plain_text',
          text: 'These are users you have permissions to run /give for.'
        }
      }
    ]
  }
}

const approveOrDeny = (
  user: string,
  app: App,
  permissions: PermissionLevels
): (Block | KnownBlock)[] => [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${app.name}* (an app) just asked for ${permissions} permissions. Approve or deny:`
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
          id: app.id,
          permissions
        }),
        action_id: 'approve-perms'
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
          app: app.name,
          permissions
        }),
        action_id: 'deny-perms'
      }
    ]
  }
]

const editApp = (app: App): View => ({
  callback_id: 'edit-app',
  private_metadata: JSON.stringify({ prevName: app.name }),
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
        text: 'App name'
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
        text: 'What does this do?'
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
          text: 'Request permissions'
        },
        options: cascadingPermissions as Array<PlainTextOption>,
        action_id: 'permissions',
        initial_option: cascadingPermissions[
          mappedPermissionValues[app.permissions]
        ] as PlainTextOption
      },
      label: {
        type: 'plain_text',
        text: 'Select a permission level'
      }
    }
  ]
})

const getApp = (app: App, user: Identity): (Block | KnownBlock)[] => {
  let blocks: (Block | KnownBlock)[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Here's *${app.name}*:\n>_${app.description}_`
      }
    }
  ]

  if (
    user.permissions === PermissionLevels.ADMIN ||
    user.specificApps.find(id => app.id === id)
  ) {
    let actions: ActionsBlock = {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Edit'
          },
          action_id: 'edit-app',
          value: JSON.stringify({ app: app.id })
        }
      ]
    }
    if (app.permissions === PermissionLevels.WRITE_SPECIFIC)
      actions.elements.push({
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Request specific permissions'
        },
        action_id: 'edit-specific-perms',
        value: JSON.stringify({ id: app.id })
      })
    actions.elements.push(
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Delete app'
        },
        style: 'danger',
        action_id: 'delete-app-confirmation',
        value: JSON.stringify({ id: app.id })
      },
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Regenerate token'
        },
        style: 'danger',
        action_id: 'regenerate-token',
        value: JSON.stringify({ id: app.id })
      }
    )
    blocks.push(actions)
  }

  return blocks
}

const privateApp = (
  app: App,
  kind: string = 'created'
): (Block | KnownBlock)[] => {
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
        text: `*${app.name}* ${kind}, your app ID is ${
          app.id
        } and your app token is \`${
          app.key
        }\`. (Don't share it with anyone unless they're also working on the app!) Your app can: ${
          permissionDesc[app.permissions]
        }\n\nTo edit your app/request a permission level, run \`/bot ${
          app.name
        }\`.`
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
    text: 'Create'
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
        text: 'Description'
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
