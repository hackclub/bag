import { prisma } from '../../db'
import { mappedPermissionValues } from '../../permissions'
import { channels, getKeyByValue } from '../../utils'
import slack, { execute } from '../slack'
import { cascadingPermissions } from '../views'
import { App, PermissionLevels } from '@prisma/client'
import { Block, KnownBlock, View, PlainTextOption } from '@slack/bolt'
import { v4 as uuid } from 'uuid'

slack.command('/bag-app', async props => {
  await execute(props, async (props, permission) => {
    const message = props.command.text
    const command = message.split(' ')[0]

    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      }
    })

    switch (command) {
      // case 'list':
      //   let apps = await prisma.app.findMany()
      //   if (permission < mappedPermissionValues.READ_PRIVATE)
      //     apps = apps.filter(app => app.public)
      //   if (permission < mappedPermissionValues.WRITE)
      //     apps = apps.filter(
      //       app =>
      //         app.public || user.specificApps.find(appId => appId === app.id)
      //     )
      //   let formatted: (Block | KnownBlock)[] | (Block | KnownBlock)[][] =
      //     apps.map(app => getApp(app))
      //   formatted = formatted.map(appBlock => appBlock[0])
      //   if (!formatted.length)
      //     formatted = [
      //       {
      //         type: 'section',
      //         text: {
      //           type: 'mrkdwn',
      //           text: 'No apps yet.'
      //         }
      //       }
      //     ]
      //   return await props.client.chat.postMessage({
      //     channel: props.body.channel_id,
      //     user: props.context.userId,
      //     blocks: [
      //       {
      //         type: 'section',
      //         text: {
      //           type: 'mrkdwn',
      //           text: `Here's a list of all the ${
      //             permission < mappedPermissionValues.READ_PRIVATE
      //               ? 'public '
      //               : ''
      //           }apps currently in the bag:`
      //         }
      //       },
      //       ...formatted,
      //       {
      //         type: 'section',
      //         text: {
      //           type: 'mrkdwn',
      //           text: 'You can write your own! Start by running `/bag-app create`.'
      //         }
      //       }
      //     ]
      //   })
      case 'get':
        try {
          const app = await prisma.app.findUnique({
            where: {
              name: props.body.text.split(' ').slice(1).join(' ')
            }
          })

          if (!app) throw new Error()
          if (user.permissions === PermissionLevels.READ && !app.public)
            throw new Error()
          if (
            mappedPermissionValues[user.permissions] <
              mappedPermissionValues.ADMIN &&
            !app.public &&
            !user.specificApps.find(appId => appId === app.id)
          )
            throw new Error()

          return await slack.client.chat.postMessage({
            channel: props.body.channel_id,
            user: props.context.userId,
            blocks: getApp(app)
          })
        } catch {
          return await slack.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            text: `Oops, couldn't find an app named *${props.body.text
              .split(' ')
              .slice(1)
              .join(' ')}*.`
          })
        }
      case 'search':
        try {
          const query = message.split(' ').slice(1).join('')
          if (query[0] !== '`' || query[query.length - 1] !== '`')
            throw new Error()
          const where = JSON.parse(query.slice(1, query.length - 1))
          delete where.key
          delete where.specificApps
          delete where.specificItems
          delete where.specificRecipes
          let apps = await prisma.app.findMany({
            where
          })
          if (!apps.length) throw new Error()

          if (permission < mappedPermissionValues.READ_PRIVATE)
            apps = apps.filter(app => app.public)
          if (permission < mappedPermissionValues.WRITE)
            apps = apps.filter(
              app =>
                app.public || user.specificApps.find(appId => appId === app.id)
            )

          const formatted = apps.map(app => getApp(app))
          return await props.client.chat.postMessage({
            channel: props.body.channel_id,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `Here's a list of all the apps in the bag that match ${query}:`
                }
              },
              ...formatted.map(appBlock => appBlock[0])
            ]
          })
        } catch {
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            text: "Oh no! Couldn't find any apps matching your query. Make sure your query is properly formatted - that is, a valid JSON query encased in a `code snippet`."
          })
        }
      case 'create':
        return await props.client.views.open({
          trigger_id: props.body.trigger_id,
          view: createApp(user.permissions)
        })
      case 'edit':
        const [_, id, key] = props.body.text.split(' ')
        if (Number.isNaN(Number(id)))
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            text: 'Oh no! Looks like you provided an invalid ID for the app.'
          })

        const app = await prisma.app.findUnique({
          where: {
            id: Number(id),
            AND: [{ key }]
          }
        })
        if (!app)
          return await props.client.chat.postEphemeral({
            channel: props.body.channel_id,
            user: props.context.userId,
            text: 'Oh no! App not found, or an incorrect key was used.'
          })

        return await props.client.views.open({
          trigger_id: props.body.trigger_id,
          view: editApp(app)
        })
      default:
        return await props.client.chat.postEphemeral({
          channel: props.body.channel_id,
          user: props.context.userId,
          blocks: appDialog
        })
    }
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
        field[Object.keys(field)[0]].value ||
        Object.values(field)[0].selected_option.value ||
        ''
      if (fields[Object.keys(field)[0]] === 'true')
        fields[Object.keys(field)[0]] = true
      else if (fields[Object.keys(field)[0]] === 'false')
        fields[Object.keys(field)[0]] = false
    }

    // Make sure app doesn't exist yet
    if (await prisma.app.findUnique({ where: { name: fields.name } }))
      throw new Error('Name is already being used')

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
        field[Object.keys(field)[0]].value ||
        Object.values(field)[0].selected_option.value ||
        ''
      if (fields[Object.keys(field)[0]] === 'true')
        fields[Object.keys(field)[0]] = true
      else if (fields[Object.keys(field)[0]] === 'false')
        fields[Object.keys(field)[0]] = false
    }

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
        return await props.client.chat.postEphemeral({
          channel: props.context.userId,
          user: props.context.userId,
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
      where: {
        name: prevName
      }
    })

    // Request permissions if changed
    if (
      mappedPermissionValues[app.permissions] >
      mappedPermissionValues[fields.permissions]
    ) {
      // Give downgrade without permissions
      await prisma.app.update({
        where: {
          name: prevName
        },
        data: {
          permissions: fields.permissions
        }
      })
    } else if (app.permissions !== fields.permissions) {
      await props.client.chat.postMessage({
        channel: channels.approvals,
        blocks: approveOrDenyAppPerms(
          props.context.userId,
          app,
          fields.permissions as PermissionLevels
        )
      })
    }

    delete fields.permissions
    app = await prisma.app.update({
      where: {
        name: prevName
      },
      data: fields
    })
    await props.client.chat.postMessage({
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
      where: {
        id: appId
      },
      data: {
        permissions: permissions as PermissionLevels
      }
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

const getApp = (app: App): (Block | KnownBlock)[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `Here's *${app.name}*:

>_${app.description}_

ID: ${app.id}
Metadata: \`${
          app.metadata === null || !Object.keys(app.metadata).length
            ? '{}'
            : app.metadata
        }\``
      }
    }
  ]
}

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
  }
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
        }\n\nTo edit your app/request a permission level, run \`/bag-app edit ${
          app.id
        } ${app.key}\``
      }
    }
  ]
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

const approveOrDenyAppPerms = (
  user: string,
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
}

const appDialog: (Block | KnownBlock)[] = [
  {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Options for \`bag-app\`:
\`/bag-app search <query>\`: Query all the public apps by passing in a JSON query. Keys: \`name\`, \`description\`, \`permissions\`, \`public\`, and \`metadata\`.
\`/bag-app create\`: Create an app.
\`/bag-app edit <id> <key>\`: Edit an app.
\`/bag-app get <name>\`: View more info about an app.`
    }
  }
]
