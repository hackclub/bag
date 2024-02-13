import { type IdentityWithInventory, prisma } from '../../db'
import slack, { execute, CommandMiddleware } from '../slack'
import fs from 'fs'
import path from 'path'
import { parse } from 'yaml'

const canBeUsed = async (
  user: IdentityWithInventory,
  instance: { itemId: string; quantity: number }
): Promise<boolean> => {
  const userInstance = user.inventory.find(
    item => item.itemId.toLowerCase() === instance.itemId
  )
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

slack.command('/huh', async props => {
  await execute(props, async props => {
    const user = await prisma.identity.findUnique({
      where: { slack: props.context.userId },
      include: { inventory: true }
    })

    // Get inputs
    const message = props.command.text.trim()
    let inputs: Array<string>
    try {
      inputs = await Promise.all(
        message
          .split(',')
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
            if (!user.inventory.find(instance => instance.itemId === ref.name))
              throw new Error(
                `Oops, looks like you don't have ${ref.reaction} ${ref.name} in your inventory.`
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
    const uses = await actions()
    let possible
    try {
      const conversation = await props.client.conversations.info({
        channel: props.body.channel_id
      })
      let possible = []
      for (let use of uses) {
        if (use.locations.includes(conversation.channel.name)) {
          let canUse = true
          const useInputs = [...(use.tools || []), ...(use.inputs || [])]
          for (let input of useInputs) {
            const inputCount = useInputs.reduce((acc, curr) => {
              if (curr === input) return ++acc
              return acc
            }, 0)
            // Exact uses
            if (
              !inputs.includes(input.toLowerCase()) ||
              (await canBeUsed(user, {
                itemId: input.toLowerCase(),
                quantity: inputCount
              })) === false
            )
              canUse = false
          }
          if (canUse) possible.push(use)
        }
      }
      if (!possible.length)
        return await props.respond({
          response_type: 'ephemeral',
          text: `Looks like you can't use ${
            inputs.length === 1 ? 'that' : 'those'
          } for anything here.`
        })
    } catch (error) {
      console.log(error)
      return await props.respond({
        response_type: 'ephemeral',
        text: `Looks like you can't use ${
          inputs.length === 1 ? 'that' : 'those'
        } for anything here.`
      })
    }

    const { channel, ts } = await props.client.chat.postMessage({
      channel: props.body.channel_id,
      text: `<@${props.context.userId}> ran \`/use\`:\n`
    })

    // If so, create a Results tree from the results value
    let tree = new Results({ ...possible[0], thread: { channel, ts } })

    while (tree.results.length) {
      // And run that tree until we reach a terminating action
      let result = tree.pickResult()
      await result.run(props, tree.thread)
      if (!result.loop) tree = result
    }
  })
})

class Results {
  description?: string
  frequency: number
  loop: boolean
  delay?: [number, number]
  await?: [number, number]
  results: Array<Results>
  inputs: Array<string>
  outputs: Array<string>
  losses: Array<string>
  thread: { channel: string; ts: string }

  constructor(obj: { [key: string]: any }) {
    this.description = obj.description || ''
    this.frequency = obj.frequency || 0
    this.loop = obj.loop || 0
    this.delay = obj.delay || [5, 10]
    this.await = obj.await || [0, 0]
    this.results = obj.results?.map(result => new Results(result)) || []
    this.inputs = obj.inputs || []
    this.outputs = obj.outputs || []
    this.losses = obj.losses || []
    this.thread = obj.thread || undefined
  }

  pickResult(): Results {
    // We pick based on a fraction of the sum of all frequencies for the results at this layer of the tree
    const frequencies = this.results.map(result => result.frequency)
    let total = frequencies.reduce((acc, curr) => acc + curr, 0)
    const random = Math.floor(Math.random() * total)
    for (let [i, frequency] of frequencies.entries()) {
      total -= frequency
      if (random >= total) return this.results[i]
    }
  }

  async run(
    props: CommandMiddleware,
    thread?: { channel: string; ts: string }
  ) {
    // Run tree
    if (this.await) await sleep(random(...this.await))

    if (this.description) {
      if (thread) {
        const conversation = await props.client.conversations.history({
          ...thread,
          inclusive: true,
          limit: 1
        })
        await props.client.chat.update({
          ...thread,
          text: conversation.messages[0].text + '\n' + this.description
        })
        this.thread = thread
      } else {
        const { channel, ts } = await props.say({
          text: this.description
        })
        this.thread = { channel, ts }
      }
    }

    if (this.outputs) {
      // Give user the outputs
      for (let output of this.outputs) {
        // Check if use already has an instance and add to that instance
        const existing = await prisma.instance.findFirst({
          where: {
            identityId: props.body.user_id,
            itemId: output
          }
        })
        if (existing)
          await prisma.instance.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + 1 }
          })
        else {
          const item = await prisma.item.findUnique({ where: { name: output } })
          await prisma.instance.create({
            data: {
              itemId: output,
              identityId: props.body.user_id,
              quantity: 1,
              public: item.public
            }
          })
        }
      }
    }

    if (this.losses) {
      // Remove losses from user's inventory
      for (let loss of this.losses) {
        // Check if user has instance
        const existing = await prisma.instance.findFirst({
          where: {
            identityId: props.body.user_id,
            itemId: loss
          }
        })
        if (existing)
          await prisma.instance.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity - 1 }
          })
      }
    }

    if (this.delay) await sleep(random(...this.delay))
  }
}

const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min)

const sleep = async (seconds: number) =>
  new Promise(r => setTimeout(r, seconds * 1000))

const actions = async () => {
  if (!global.uses) {
    global.uses = parse(
      fs.readFileSync(path.join(process.cwd(), './test.yaml'), 'utf-8')
    )
  }

  return global.uses
}
