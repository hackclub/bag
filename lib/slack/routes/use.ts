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
    let summary = { outputs: [], losses: [] }

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

    if (tag.length) {
      // When the tag field is used for testing with a single-hyphen prefix the test should play out normally from the start
      // This means we search for a direct route to the result
      trees = trees[0].search(trim(tag, '-'), Infinity)
      if (!trees.length)
        return await props.respond({
          response_type: 'ephemeral',
          text: `${tag} is not applicable.`
        })
      for (let [i, node] of trees.entries()) {
        node.thread = { channel, ts }
        if (tag.startsWith('--')) {
          // No delay/await
          node.delay = 0
          node.await = 0
        }
        await node.run(props, trees.slice(0, i), description, summary)
      }
    }

    try {
      while (
        trees[trees.length - 1].branches.length ||
        trees[trees.length - 1].sequence.length
      ) {
        // Even if there was a tag attached, run normally from there on out
        const tree = trees[trees.length - 1]

        let result
        if (!tree.sequence.length) result = tree.pickBranch()
        else result = tree
        result.thread = tree.thread

        if (tag.startsWith('---')) {
          // No delay/await
          result.delay = 0
          result.await = 0
        }

        let results = await result.run(props, trees, description, summary)
        trees = results
        if (result.terminate) break
      }
    } catch (error) {
      console.log(error)
    }

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

    await props.client.chat.update({
      channel,
      ts,
      text: description.join('\n\n')
    })
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
    this.delay = obj.delay || obj.defaultDelay || [5, 10]
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
    if (this.tag === tag) return [this]
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
    description: Array<string>,
    summary: {
      outputs: Array<[number, string]>
      losses: Array<[number, string]>
    }
  ): Promise<Array<Results>> {
    if (this.sequence.length)
      return await this.runSequence(props, prev, description, summary)
    else return await this.runBranch(props, prev, description, summary)
  }

  async runSequence(
    props: CommandMiddleware,
    prev: Array<Results>,
    description: Array<string>,
    summary: {
      outputs: Array<[number, string]>
      losses: Array<[number, string]>
    }
  ): Promise<Array<Results>> {
    // Run sequence in order
    for (let node of this.sequence) {
      let result = await node.run(props, prev, description, summary)
      if (node.branches) {
        // Run through the branches
        let trees = [node]
        while (
          trees[trees.length - 1].branches.length ||
          trees[trees.length - 1].sequence.length
        ) {
          // const
        }
      }
      if (node.break) break
    }

    return prev
  }

  async runBranch(
    props: CommandMiddleware,
    prev: Array<Results>,
    description: Array<string>,
    summary: {
      outputs: Array<[number, string]>
      losses: Array<[number, string]>
    }
  ): Promise<Array<Results>> {
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
        const item = await prisma.item.findUnique({ where: { name: output } })

        const outputSummary = summary.outputs.findIndex(
          summaryOutput => summaryOutput[1] === `${item.reaction} ${item.name}`
        )
        if (outputSummary >= 0)
          summary.outputs[outputSummary] = [
            summary.outputs[outputSummary][0] + 1,
            `${item.reaction} ${item.name}`
          ]
        else summary.outputs.push([1, `${item.reaction} ${item.name}`])

        if (existing)
          await prisma.instance.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + 1 }
          })
        else {
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
          },
          include: { item: true }
        })

        if (existing) {
          if (existing.quantity - 1 === 0)
            await prisma.instance.update({
              where: { id: existing.id },
              data: { identity: { disconnect: true } }
            })
          else
            await prisma.instance.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity - 1 }
            })

          const lossSummary = summary.losses.findIndex(
            summaryLoss =>
              summaryLoss[1] ===
              `${existing.item.reaction} ${existing.item.name}`
          )
          if (lossSummary >= 0)
            summary.losses[lossSummary] = [
              summary.losses[lossSummary][0] + 1,
              `${existing.item.reaction} ${existing.item.name}`
            ]
          else
            summary.losses.push([
              1,
              `${existing.item.reaction} ${existing.item.name}`
            ])
        }
      }
    }

    if (this.delay) {
      if (Array.isArray(this.delay))
        await sleep(random(...(this.delay as [number, number])))
      else await sleep(this.delay)
    }

    if (this.goto) {
      // When a node with a goto completes, the action will move to the node with a matching tag. This lets us have multiple divergent branches that come back to an earlier node in the tree
      let newTree = prev[0].search(this.goto, Infinity)
      newTree[newTree.length - 1].thread = this.thread
      return newTree
    } else if (this.gotoChildren) {
      // The gotoChildren field acts like goto, except it skips the contents of the tagged node and instead goes to its children. This is useful mostly when we want to return not to a specific node, but to some rnadomly-selected branch directly beneath it.
      let newTree = prev[0].search(this.gotoChildren, Infinity)
      const tree = newTree[newTree.length - 1]
      tree.thread = this.thread
      newTree.push(tree)
      if (tree.branches.length) {
        // Add a random child
        const branch = tree.pickBranch()
        branch.thread = this.thread
        await branch.run(props, newTree, description, summary)
      }
      return newTree
    }

    if (!this.loop) prev.push(this)
    return prev
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
