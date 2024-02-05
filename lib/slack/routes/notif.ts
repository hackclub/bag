import { prisma } from '../../db'
import slack, { execute } from '../slack'

slack.command('/notifs', async props => {
  await execute(props, async props => {
    const message = props.command.text.trim().toLowerCase()

    if (message === 'on') {
      await prisma.identity.update({
        where: { slack: props.context.userId },
        data: { notifs: true }
      })
      return await props.respond({
        response_type: 'ephemeral',
        text: 'Turned notifications for mentions on.'
      })
    } else if (message === 'off') {
      await prisma.identity.update({
        where: { slack: props.context.userId },
        data: { notifs: false }
      })
      return await props.respond({
        response_type: 'ephemeral',
        text: 'Turned notifications for mentions off. Note that you will still be mentioned in trades.'
      })
    }
    await props.respond({
      response_type: 'ephemeral',
      text: 'Try running `/notifs <on|off>`!'
    })
  })
})
