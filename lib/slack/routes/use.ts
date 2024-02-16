import { type IdentityWithInventory, prisma } from '../../db'
import { inMaintainers, maintainers } from '../../utils'
import slack, { execute, CommandMiddleware } from '../slack'
import fs from 'fs'
import path from 'path'
import { parse } from 'yaml'

const ACTION_TEST = ['action-test', 'test888']

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

    if (
      !Object.values(maintainers)
        .map((maintainer: any) => maintainer.slack)
        .includes(user.slack)
    )
      return await props.respond({
        response_type: 'ephemeral',
        text: 'no.'
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
      else tag = undefined
    } else tag = undefined

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
    let possible = []
    try {
      const conversation = await props.client.conversations.info({
        channel: props.body.channel_id
      })
      for (let use of uses) {
        if (
          use.locations.includes(conversation.channel.name) ||
          ACTION_TEST.includes(conversation.channel.name)
        ) {
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

    let description = [`<@${user.slack}> ran \`/use ${message}\`:`]

    const { channel, ts } = await props.client.chat.postMessage({
      channel: props.body.channel_id,
      text: description[0]
    })

    let trees = [
      new Results({
        ...possible[0],
        thread: { channel, ts }
      })
    ]

    if (tag) {
      // When the tag field is used for testing with a single-hyphen prefix the test should play out normally from the start
      // This means we search for a direct route to the result
      const path = trees[0].search(trim(tag, '-'), Infinity)
      if (!path.length)
        return await props.respond({
          response_type: 'ephemeral',
          text: `${tag} is not applicable.`
        })
      for (let [i, node] of path.entries()) {
        node.thread = { channel, ts }
        if (tag.startsWith('---')) {
          // No delay/await
          node.delay = 0
          node.await = 0
        }
        await node.run(props, path.slice(0, i), description)
      }
    } else {
      while (trees[trees.length - 1].branches.length) {
        const tree = trees[trees.length - 1]

        let result = tree.pickBranch()
        result.thread = tree.thread

        await result.run(props, trees, description)
        if (result.terminate) break
        if (!result.loop) trees.push(result)
      }
    }
  })
})

class Results {
  tag?: string
  description?: string
  thread: { channel: string; ts: string }

  goto?: string
  gotoChildren?: string

  terminate?: boolean
  break?: boolean

  frequency: number

  loop: boolean
  delay?: number | [number, number]
  await?: number | [number, number]

  branches: Array<Results>
  sequence: Array<Results>

  inputs: Array<string>
  outputs: Array<string>
  losses: Array<string>

  constructor(obj: { [key: string]: any }) {
    this.tag = obj.tag
    this.description = obj.description
    this.thread = obj.thread

    this.goto = obj.goto
    this.gotoChildren = obj.gotoChildren

    this.terminate = obj.terminate || false
    this.break = obj.break || false

    this.frequency = obj.frequency || 0

    this.loop = obj.loop || false
    this.delay = obj.delay || obj.defaultDelay
    this.await = obj.await || 0

    this.branches =
      obj.branch?.map(branch => {
        // Apply default delays and other properties
        return new Results({
          ...branch,
          delay: branch.delay || obj.defaultDelay
        })
      }) || []
    this.sequence = obj.sequence?.map(sequence => new Results(sequence)) || []

    this.inputs = obj.inputs || []
    this.outputs = obj.outputs || []
    this.losses = obj.losses || []
  }

  pickBranch(): Results {
    // We pick based on a fraction of the sum of all frequencies for the results at this layer of the tree
    const frequencies = this.branches.map(result => result.frequency)
    let total = frequencies.reduce((acc, curr) => acc + curr, 0)
    const random = Math.floor(Math.random() * total)
    for (let [i, frequency] of frequencies.entries()) {
      total -= frequency
      if (random >= total) return this.branches[i]
    }
  }

  search(tag: string, depth: number = 1, curr: number = 1): Array<Results> {
    // Search for branch that has tag up to depth
    let branches = []
    for (let branch of this.branches) {
      if (branch.tag === tag) {
        branches.push(branch)
        return branches
      } else if (curr < depth && branch.branches) {
        // Search up to depth
        let traverse = branch.search(tag, depth, curr + 1)
        if (traverse.length) {
          branches.push(branch, ...traverse)
          return branches
        }
      }
    }

    return branches
  }

  async run(
    props: CommandMiddleware,
    prev: Array<Results>,
    description: Array<string>
  ) {
    if (this.sequence.length) await this.runSequence(props, prev, description)
    else await this.runBranch(props, prev, description)
  }

  async runSequence(
    props: CommandMiddleware,
    prev: Array<Results>,
    description: Array<string>
  ) {
    // Run sequence in order
    for (let node of this.sequence) {
      let result = await node.run(props, prev, description)
      if (node.branches) prev.push(node) // ! Check
      if (node.break) break // ! Check
    }
  }

  async runBranch(
    props: CommandMiddleware,
    prev: Array<Results>,
    description: Array<string>
  ) {
    // Run tree
    if (this.await) {
      if (Array.isArray(this.await))
        await sleep(random(...(this.await as [number, number])))
      else await sleep(this.await)
    }

    if (this.description) {
      description.push(this.description)
      await props.client.chat.update({
        ...this.thread,
        text: description.join('\n\n')
      })
    }

    if (this.outputs) {
      // Give user the outputs
      for (let output of this.outputs) {
        // Check if user already has an instance and add to that instance
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

    if (this.delay) {
      if (Array.isArray(this.delay))
        await sleep(random(...(this.delay as [number, number])))
      else await sleep(this.delay)
    }
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
