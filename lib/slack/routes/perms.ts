import slack, { execute } from '../slack'
import { PrismaClient, PermissionLevels, Identity } from '@prisma/client'
import { channels, getKeyByValue } from '../../utils'
import { mappedPermissionValues } from '../../permissions'
import { View, Block, KnownBlock, PlainTextOption } from '@slack/bolt'
import { cascadingPermissions } from '../views'

const prisma = new PrismaClient()

slack.command('/bag-request-perms', async props => {
  await execute(props, async props => {
    // Let user request permissions
    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      }
    })
    return await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: requestPerms(user)
    })
  })
})

slack.view('user-request-perms', async props => {
  await execute(props, async props => {
    let permissions = Object.values(props.view.state.values)[0].permissions
      .selected_option.value
    await props.client.chat.postMessage({
      channel: channels.approvals,
      blocks: approveOrDenyPerms(
        props.context.userId,
        permissions as PermissionLevels
      )
    })
    await props.client.chat.postMessage({
      channel: props.context.userId,
      user: props.context.userId,
      text: 'Permission request made! You should get a response sometime in the next 24 hours if today is a weekday, and 72 hours otherwise!'
    })
  })
})

slack.action('user-approve-perms', async props => {
  await execute(props, async props => {
    try {
      // @ts-expect-error
      let { user: userId, permissions } = JSON.parse(props.action.value)
      permissions = getKeyByValue(mappedPermissionValues, permissions)

      // Approve user
      await prisma.identity.update({
        where: {
          slack: userId
        },
        data: {
          permissions: permissions as PermissionLevels
        }
      })
      await props.say(
        `${
          permissions[0].toUpperCase() + permissions.slice(1)
        } for <@${userId}> approved.`
      )

      // Let user know
      // @ts-expect-error
      await props.client.chat.postMessage({
        channel: userId,
        text: `Your request for ${
          permissions[0].toUpperCase() + permissions.slice(1)
        } permissions was approved!`
      })
    } catch {
      return await props.say('Permissions already applied.')
    }
  })
})

slack.action('user-deny-perms', async props => {
  await execute(props, async props => {
    try {
      // Let user know
      // @ts-expect-error
      let { user: userId, permissions } = JSON.parse(props.action.value)
      permissions = getKeyByValue(mappedPermissionValues, permissions)

      // @ts-expect-error
      await props.client.chat.postMessage({
        channel: userId,
        text: `Your request for ${permissions} permissions was rejected.`
      })
    } catch {
      return await props.say('Permissions already applied.')
    }
  })
})

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
