import { log } from '../../analytics'
import { type IdentityWithInventory, prisma } from '../../db'
import { mappedPermissionValues } from '../../permissions'
import { scheduler, random, Results, showAction } from '../../queue/use'
import { inMaintainers } from '../../utils'
import slack, { execute, CommandMiddleware } from '../slack'

const ACTION_TEST = ['action-test']

const sleep = async (seconds: number) =>
  new Promise(r => setTimeout(r, seconds * 1000))

const canBeUsed = async (
  user: IdentityWithInventory,
  instance: { itemId: string; quantity: number }
): Promise<boolean> => {
  const userInstance = user.inventory.find(
    item => item.itemId.toLowerCase() === instance.itemId
  )
  if (!userInstance) return false
  let quantityLeft = userInstance.quantity

  const otherTrades = await prisma.trade.findMany({
    where: {
      closed: false, // Not closed
      OR: [
        { initiatorTrades: { some: { instanceId: userInstance.id } } },
        { receiverTrades: { some: { instanceId: userInstance.id } } }
      ] // Either in initiatorTrades or receiverTrades
    },
    include: {
      initiatorTrades: true,
      receiverTrades: true
    }
  })
  const otherOffers = otherTrades.map(offer => ({
    ...offer,
    trades: [...offer.initiatorTrades, ...offer.receiverTrades]
  }))
  quantityLeft -= otherOffers.reduce((acc, curr) => {
    return (
      acc +
      curr.trades.find(trade => trade.instanceId === userInstance.id).quantity
    )
  }, 0)
  if (quantityLeft <= 0) return false

  const crafting = await prisma.crafting.findFirst({
    where: {
      identityId: user.slack,
      recipeId: null
    },
    include: { inputs: true }
  })
  const inCrafting =
    crafting?.inputs.find(input => input.instanceId === userInstance.id)
      ?.quantity || 0
  if (quantityLeft - inCrafting <= 0) return false

  return true
}

slack.command('/rlb-use', async props => {
  await execute(
    props,
    async props => {
      await log('slack-use', `${props.context.userId}-${Date.now()}`, {
        channel: props.body.channel_id,
        user: (await props.client.users.info({ user: props.context.userId }))
          .user.profile.display_name,
        command: `/use ${props.command.text}`
      })

      const conversation = await props.client.conversations.info({
        channel: props.body.channel_id
      })

      const test = ACTION_TEST.includes(conversation.channel.name)

      const user = await prisma.identity.findUnique({
        where: { slack: props.context.userId },
        include: { inventory: true }
      })

      if (
        await prisma.actionInstance.findFirst({
          where: {
            identityId: props.context.userId,
            done: false
          }
        })
      )
        return await props.respond({
          response_type: 'ephemeral',
          text: ":clown_face: Unless you're some kind of god, you're stuck doing things one at a time."
        })

      // Get inputs
      const message = props.command.text.trim()
      if (!message.length)
        return await props.respond({
          response_type: 'ephemeral',
          text: 'Try running `/use <item>, <item>` or `/use :-item-tag, :item-tag`!'
        })

      const trim = (str: string, chars: string) =>
        str.split(chars).filter(Boolean).join(chars)
      let inputs: Array<string> = message.split(',')
      let tag = message.split(' ')[message.split(' ').length - 1]
      if (inMaintainers(user.slack)) {
        // Check if a tag is attached
        if (tag.startsWith('-'))
          inputs[inputs.length - 1] = trim(inputs[inputs.length - 1], tag)
        else tag = ''
      } else tag = ''

      try {
        inputs = await Promise.all(
          inputs
            .filter(s => s.length)
            .map(async s => {
              let item = s.trim().toLowerCase()
              const ref = item.startsWith(':')
                ? await prisma.item.findFirst({ where: { reaction: item } })
                : await prisma.item.findFirst({
                    where: {
                      name: {
                        equals: item,
                        mode: 'insensitive'
                      }
                    }
                  })
              if (!ref) throw new Error(`Oops, couldn't find *${s.trim()}*.`)
              if (
                !test &&
                !(await canBeUsed(user, { itemId: item, quantity: 1 }))
              )
                throw new Error(
                  `Oops, looks like you you can't use ${ref.reaction} ${ref.name} right now. You could possibly be using ${ref.reaction} ${ref.name} somewhere else.`
                )
              return ref.name.toLowerCase()
            })
        )
      } catch (error) {
        return await props.respond({
          response_type: 'ephemeral',
          text: error.message
        })
      }

      // Check if inputs can be used in location
      let possible = await prisma.action.findFirst({
        where: {
          locations: test ? undefined : { has: conversation.channel.name },
          tools: { hasEvery: inputs }
        }
      })
      if (!possible)
        return await props.respond({
          response_type: 'ephemeral',
          text: `Looks like you can't use ${
            inputs.length === 1 ? 'that' : 'those'
          } for anything here.`
        })

      const action = await prisma.actionInstance.create({
        data: {
          identityId: user.slack,
          actionId: possible.id
        }
      })

      let description = [`<@${user.slack}> ran \`/use ${message}\`:`]
      let summary = { outputs: [], losses: [] }

      let trees = [
        new Results({
          ...possible,
          action,
          test,
          user: props.body.user_id
        })
      ]

      let channel = props.body.channel_id
      let ts: string

      if (tag.length && trim(tag, '-').length) {
        // When the tag field is used for testing with a single-hyphen prefix the test should play out normally from the start
        trees = trees[0].search(trim(tag, '-'), Infinity)
        if (!trees.length) {
          await prisma.actionInstance.update({
            where: { id: action.id },
            data: { done: true }
          })
          return await props.respond({
            response_type: 'ephemeral',
            text: `${tag} is not applicable.`
          })
        }
        ts = (
          await props.client.chat.postMessage({
            channel: props.body.channel_id,
            blocks: showAction(action, description.slice(0, 1), { channel, ts })
          })
        ).ts
        for (let [i, node] of trees.entries()) {
          node.thread = i === 0 ? { channel, ts } : trees[i - 1].thread
          node.action = action
          node.user = props.body.user_id
          if (i === trees.length) node.delay = 0
          if (!tag.startsWith('--'))
            await sleep(
              Array.isArray(node.await) ? random(...node.await) : node.await
            )
          await node.run(slack, trees.slice(0, i), description, summary)
          if (!tag.startsWith('--'))
            await sleep(
              Array.isArray(node.delay) ? random(...node.delay) : node.delay
            )
        }

        // Stop if last branch
        if (!trees[trees.length - 1].branch.length) {
          if (summary.outputs.length)
            description.push(
              `\n*What you got*: ${summary.outputs
                .map(output => `x${output[0]} ${output[1]}`)
                .join(', ')}`
            )
          if (summary.losses.length)
            description.push(
              `\n*What you lost*: ${summary.losses
                .map(loss => `x${loss[0]} ${loss[1]}`)
                .join(', ')}`
            )

          await prisma.actionInstance.update({
            where: { id: action.id },
            data: { done: true }
          })
          return await props.client.chat.update({
            ...trees[trees.length - 1].thread,
            blocks: showAction(action, description, true)
          })
        }
      } else {
        ts = (
          await props.client.chat.postMessage({
            channel: props.body.channel_id,
            blocks: showAction(action, description, { channel, ts })
          })
        ).ts
        trees[trees.length - 1].thread = { channel, ts }
      }

      let tree = trees[trees.length - 1]
      let branch = tree.pickBranch()
      branch.thread = tree.thread
      branch.action = tree.action
      if (!branch.branch.length) branch.delay = 0
      let timestamp = new Date().getTime()
      if (branch.await)
        timestamp += Array.isArray(branch.await)
          ? random(...branch.await)
          : branch.await
      scheduler.schedule(
        {
          action,
          trees,
          branch,
          description,
          summary,
          tag,
          user: props.body.user_id
        },
        timestamp
      )
    },
    mappedPermissionValues.READ,
    true
  )
})

slack.action('cancel-use', async props => {
  return await execute(props, async props => {
    // @ts-expect-error
    const { id, thread } = JSON.parse(props.action.value)

    const action = await prisma.actionInstance.findUnique({
      where: { id, done: false }
    })

    if (action.identityId !== props.body.user.id)
      return await props.respond({
        response_type: 'ephemeral',
        text: "You're not the one doing that, are you?"
      })

    await prisma.actionInstance.update({
      where: { id },
      data: { done: true }
    })

    // @ts-expect-error
    await props.client.chat.delete({ ...thread })

    // @ts-expect-error
    await props.client.chat.postEphemeral({
      channel: props.body.channel.id,
      user: props.body.user.id,
      text: 'Action canceled.'
    })
  })
})
