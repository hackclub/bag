import { IdentityWithInventory, findOrCreateIdentity } from '../../db'
import slack, { execute } from '../slack'
import { PrismaClient } from '@prisma/client'
import { View } from '@slack/bolt'

const prisma = new PrismaClient()

slack.command('/give', async props => {
  await execute(props, async props => {
    if (!/^<@[A-Z0-9]+\|[\d\w\s]+>$/gm.test(props.command.text))
      return await props.client.chat.postEphemeral({
        channel: props.body.channel_id,
        user: props.context.userId,
        text: 'To give someone something, run `/give @<person>`!'
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
        text: "Looks like you don't have any items to give yet."
      })

    const receiver = await findOrCreateIdentity(
      props.command.text.slice(2, props.command.text.indexOf('|'))
    )

    await props.client.views.open({
      trigger_id: props.body.trigger_id,
      view: await giveDialog(
        props.context.userId,
        receiver.slack,
        props.body.channel_id
      )
    })
  })
})

slack.view('give', async props => {
  await execute(props, async props => {
    let fields: {
      item: string
      quantity: number
      note: string
    } = {
      item: undefined,
      quantity: 1,
      note: undefined
    }
    for (let field of Object.values(props.view.state.values))
      fields[Object.keys(field)[0]] =
        field[Object.keys(field)[0]].value ||
        Object.values(field)[0].selected_option?.value ||
        ''

    const { receiverId, channel } = JSON.parse(props.view.private_metadata)

    const giver = await prisma.identity.findUnique({
      where: { slack: props.context.userId },
      include: { inventory: true }
    })
    const instance = giver.inventory.find(
      instance => instance.itemId === fields.item
    )
    const ref = await prisma.item.findUnique({
      where: {
        name: instance.itemId
      }
    })

    if (fields.quantity > instance.quantity)
      return props.client.chat.postEphemeral({
        channel,
        user: props.context.userId,
        text: `Woah woah woah! It doesn't look like you have ${fields.quantity} ${ref.reaction} ${ref.name} to give away.`
      })

    const receiver = await prisma.identity.findUnique({
      where: { slack: receiverId },
      include: { inventory: true }
    })
    let transfer
    const existing = receiver.inventory.find(
      instance => instance.itemId === ref.name
    )
    if (existing !== undefined) {
      // Add to existing instance
      transfer = await prisma.instance.update({
        where: {
          id: existing.id
        },
        data: {
          quantity: existing.quantity + Math.max(fields.quantity, 1),
          metadata: instance.metadata
            ? {
                ...(existing.metadata as object),
                ...(instance.metadata as object)
              }
            : existing.metadata
        },
        include: {
          item: true
        }
      })
      await prisma.instance.delete({
        where: {
          id: instance.id
        }
      })
    } else {
      transfer = await prisma.instance.update({
        where: {
          id: instance.id
        },
        data: {
          identityId: receiver.slack
        }
      })
    }

    // Leave note for receiver
    await props.client.chat.postMessage({
      channel: receiver.slack,
      user: receiver.slack,
      text: `<@${giver.slack}> just gave you x${fields.quantity} ${
        ref.reaction
      } *${ref.name}*! It's in your inventory now.${
        fields.note ? '\n\n>' + fields.note : ''
      }`
    })
  })
})

const giveDialog = async (
  giverId: string,
  receiverId: string,
  channel: string
): Promise<View> => {
  const giver = await prisma.identity.findUnique({
    where: {
      slack: giverId
    },
    include: {
      inventory: true
    }
  })

  return {
    callback_id: 'give',
    title: {
      type: 'plain_text',
      text: 'Give from inventory'
    },
    submit: {
      type: 'plain_text',
      text: 'Give'
    },
    type: 'modal',
    private_metadata: JSON.stringify({ receiverId, channel }),
    blocks: [
      {
        type: 'input',
        element: {
          action_id: 'item',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Choose a item'
          },
          options: await Promise.all(
            giver.inventory.map(async instance => {
              const item = await prisma.item.findUnique({
                where: {
                  name: instance.itemId
                }
              })

              return {
                text: {
                  type: 'plain_text',
                  text: `x${instance.quantity} ${item.reaction} ${instance.itemId}`,
                  emoji: true
                },
                value: instance.itemId
              }
            })
          )
        },
        label: {
          type: 'plain_text',
          text: 'Item to give'
        }
      },
      {
        type: 'input',
        element: {
          type: 'number_input',
          is_decimal_allowed: false,
          action_id: 'quantity',
          min_value: '1'
        },
        label: {
          type: 'plain_text',
          text: 'Quantity'
        }
      },
      {
        type: 'input',
        optional: true,
        element: {
          type: 'plain_text_input',
          multiline: true,
          action_id: 'note',
          placeholder: {
            type: 'plain_text',
            text: 'Leave a little note!'
          }
        },
        label: {
          type: 'plain_text',
          text: 'Note'
        }
      }
    ]
  }
}
