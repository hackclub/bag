import { mappedPermissionValues } from '../../permissions'
import { channels, getKeyByValue } from '../../utils'
import slack, { execute } from '../slack'
import { cascadingPermissions } from '../views'
import { PrismaClient, PermissionLevels } from '@prisma/client'
import type { View, Block, KnownBlock, PlainTextOption } from '@slack/bolt'

const prisma = new PrismaClient()

slack.command('/bag-request-perms', async props => {
  await execute(props, async props => {
    // Let user request permissions
    return await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: requestPerms
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
    await props.respond(`${permissions} for <@${userId}> approved.`)

    // Let user know
    // @ts-expect-error
    await props.client.chat.postMessage({
      channel: userId,
      text: `Your request for ${permissions} permissions was approved!`
    })
  })
})

slack.action('user-deny-perms', async props => {
  await execute(props, async props => {
    // Let user know
    // @ts-expect-error
    let { user: userId, permissions } = JSON.parse(props.action.value)
    permissions = getKeyByValue(mappedPermissionValues, permissions)

    await props.respond(`${permissions} for <@${userId}> denied.`)

    // @ts-expect-error
    await props.client.chat.postMessage({
      channel: userId,
      text: `Your request for ${permissions} was rejected.`
    })
  })
})

const requestPerms: View = {
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
        text: 'Select a personal permission level'
      }
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
