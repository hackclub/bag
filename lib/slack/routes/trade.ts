import { IdentityWithInventory, findOrCreateIdentity } from '../../db'
import slack, { execute } from '../slack'
import { PrismaClient, Trade, Identity, Item } from '@prisma/client'
import { Block, KnownBlock, View } from '@slack/bolt'

const prisma = new PrismaClient()

slack.command('/trade', async props => {
  await execute(props, async props => {
    if (!/^<@[A-Z0-9]+\|[\d\w\s]+>$/gm.test(props.command.text))
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: 'Oh no! You need to mention a user in order to start a trade with them.'
      })

    const user = await prisma.identity.findUnique({
      where: {
        slack: props.context.userId
      },
      include: {
        inventory: true
      }
    })
    if (!user.inventory.length)
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: "Looks like you don't have any items to trade yet."
      })

    const receiver = await findOrCreateIdentity(
      props.command.text.slice(2, props.command.text.indexOf('|'))
    )
    if (!receiver.inventory.length)
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: `<@${receiver.slack}> doesn't have any items to trade yet! Perhaps you meant to run \`/give\` to give them a item.`
      })
  })
})
