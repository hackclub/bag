import { type IdentityWithInventory, prisma } from '../../db'
import { inMaintainers, maintainers } from '../../utils'
import slack, { execute, CommandMiddleware } from '../slack'

const ACTION_TEST = ['action-test', 'test888']
const LOADING = '\n:loading-dots:'

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
    const conversation = await props.client.conversations.info({
      channel: props.body.channel_id
    })

    const test = ACTION_TEST.includes(conversation.channel.name)

    const user = await prisma.identity.findUnique({
      where: { slack: props.context.userId },
      include: { inventory: true }
    })

    if (!inMaintainers(user.slack)) return
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
              !user.inventory.find(instance => instance.itemId === ref.name)
            )
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
        test
      })
    ]

    let channel = props.body.channel_id
    let ts: string

    if (tag.length && trim(tag, '-').length) {
      // When the tag field is used for testing with a single-hyphen prefix the test should play out normally from the start
      // This means we search for a direct route to the result
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
          text: description[0] + LOADING
        })
      ).ts
      for (let [i, node] of trees.entries()) {
        node.thread = i === 0 ? { channel, ts } : trees[i - 1].thread
        if (i === trees.length) node.delay = 0
        await node.run(
          props,
          trees.slice(0, i),
          description,
          summary,
          tag.startsWith('--')
        )
      }
    } else {
      ts = (
        await props.client.chat.postMessage({
          channel: props.body.channel_id,
          text: description[0] + LOADING
        })
      ).ts
      trees[trees.length - 1].thread = { channel, ts }
    }

    try {
      while (trees[trees.length - 1].branches.length) {
        // Even if there was a tag attached, run normally from there on out
        const tree = trees[trees.length - 1]

        let result
        if (!tree.sequence.length) result = tree.pickBranch()
        else result = tree

        result.thread = tree.thread
        if (!result.branches.length) result.delay = 0

        let results = await result.run(
          props,
          trees,
          description,
          summary,
          tag.startsWith('---')
        )
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

    await prisma.actionInstance.update({
      where: { id: action.id },
      data: { done: true }
    })
    await props.client.chat.update({
      ...trees[trees.length - 1].thread,
      text: description.join('\n\n')
    })
  })
})

class Results {
  tag?: string
  description?: string
  thread: { channel: string; ts: string }
  test: boolean

  goto?: string
  gotoChildren?: string

  terminate?: boolean
  break?: boolean

  frequency: number

  branches: Array<Results>
  sequence: Array<Results>

  loop: boolean
  delay?: number | [number, number]
  await?: number | [number, number]

  inputs: Array<string>
  outputs: Array<string>
  losses: Array<string>

  constructor(obj: { [key: string]: any }) {
    this.tag = obj.tag
    this.description = obj.description
    this.thread = obj.thread
    this.test = obj.test || false

    this.goto = obj.goto
    this.gotoChildren = obj.gotoChildren

    this.terminate = obj.terminate || false
    this.break = obj.break || false

    this.frequency = obj.frequency || 0

    this.sequence =
      obj.sequence?.map(
        sequence =>
          new Results({
            ...sequence,
            thread: this.thread,
            test: this.test
          })
      ) || []
    this.branches =
      obj.branch?.map(branch => {
        if (Array.isArray(branch)) {
          // If an entry in a branch array is an array, treat that sub-array as a sequence, using any additional properties on the first node in the array as if they were on the sequence node
          const initial = branch[0] // Using any additional properties on the first node in the array as if they were on the sequence node
          return new Results({
            sequence: branch.map(sequence => ({ ...sequence })),
            defaultDelay: initial.defaultDelay,
            frequency: initial.frequency,
            thread: this.thread,
            test: this.test
          })
        }
        return new Results({
          ...branch,
          delay: branch.delay || obj.defaultDelay,
          frequency: branch.frequency || this.frequency,
          thread: this.thread,
          test: this.test
        })
      }) || []

    this.loop = obj.loop || false
    this.delay = obj.delay || obj.defaultDelay || [5, 10]
    this.await = obj.await

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

  search(tag: string, depth: number = 1, curr: number = 1) {
    // Search for branch that has tag up to depth
    if (this.tag === tag) return [this]
    let branches = []
    for (let branch of this.branches) {
      if (branch.tag === tag) {
        branches.push(branch)
        return branches
      } else if (curr < depth && branch.sequence.length) {
        // Check branch sequence, too!
        let traverse = []
        for (let [i, sequence] of branch.sequence.entries()) {
          traverse.push(sequence)
          if (sequence.tag === tag) {
            for (let after of branch.sequence.slice(i + 1))
              sequence.sequence.push(after)
            traverse[traverse.length - 1] = sequence
            branches.push(...traverse)
            return branches
          } else if (curr < depth && sequence.branches.length) {
            // Search up to depth
            let traverseSequence = sequence.search(tag, depth, curr + 1)
            if (traverseSequence.length) {
              traverse.push(...traverseSequence)
              branches.push(...traverse)
              return branches
            }
          }
        }
      } else if (curr < depth && branch.branches.length) {
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
    },
    instant?: boolean
  ): Promise<Array<Results>> {
    let result = await this.runBranch(
      props,
      prev,
      description,
      summary,
      instant
    )
    if (this.sequence.length)
      return await this.runSequence(props, prev, description, summary, instant)
    return result
  }

  async runSequence(
    props: CommandMiddleware,
    prev: Array<Results>,
    description: Array<string>,
    summary: {
      outputs: Array<[number, string]>
      losses: Array<[number, string]>
    },
    instant?: boolean
  ): Promise<Array<Results>> {
    // Run sequence in order
    for (let node of this.sequence) {
      node.thread = this.thread
      let result = await node.run(props, prev, description, summary, instant)
      if (node.branches.length) {
        // Run branches
        let branch = node.pickBranch()
        branch.thread = this.thread
        result = await branch.run(props, prev, description, summary, instant)
      }
      if (node.break) break
      this.thread = result[result.length - 1].thread
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
    },
    instant?: boolean
  ): Promise<Array<Results>> {
    // Run tree
    if (this.await && !instant) {
      if (Array.isArray(this.await))
        await sleep(random(...(this.await as [number, number])))
      else await sleep(this.await)
    }

    if (this.description) {
      description.push(this.description.trim())
      try {
        await props.client.chat.update({
          ...this.thread,
          text: description.join('\n\n') + LOADING
        })
      } catch {
        // Length too long? Start a new thread
        await props.client.chat.update({
          ...this.thread,
          text: description.slice(0, description.length - 1).join('\n\n')
        })
        const { permalink } = await props.client.chat.getPermalink({
          channel: this.thread.channel,
          message_ts: this.thread.ts
        })
        description.push(
          `Continued from <${permalink}|the past>:`,
          `<@${
            props.context.userId
          }> ran \`/use ${props.command.text.trim()}\`:`,
          description[description.length - 1]
        )
        description.splice(0, description.length - 3)
        const { channel, ts } = await props.client.chat.postMessage({
          channel: this.thread.channel,
          text: description.join('\n\n') + LOADING,
          unfurl_links: false
        })
        this.thread = { channel, ts }
      }
    }

    for (let output of this.outputs) {
      // Give user the outputs
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

      if (!this.test) {
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

    for (let loss of this.losses) {
      // Remove losses from user's inventory
      const existing = await prisma.instance.findFirst({
        where: {
          identityId: props.body.user_id,
          itemId: loss
        },
        include: { item: true }
      })

      if (existing) {
        if (!this.test) {
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
        }

        const lossSummary = summary.losses.findIndex(
          summaryLoss =>
            summaryLoss[1] === `${existing.item.reaction} ${existing.item.name}`
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

    if (this.delay && !instant) {
      if (Array.isArray(this.delay))
        await sleep(random(...(this.delay as [number, number])))
      else await sleep(this.delay)
    }

    if (this.goto) {
      // When a node with a goto completes, this action will move to the node with a matching tag.
      let newTree = prev[0].search(this.goto, Infinity)
      newTree[newTree.length - 1].thread = this.thread
      return newTree
    } else if (this.gotoChildren) {
      // The gotoChildren field acts like goto, except it skips the contents of the tagged node and instead goes to its children. This is useful mostly whe we want to return not to a specific node, but to some randomly-selected branch directly beneath it.
      let newTree = prev[0].search(this.gotoChildren, Infinity)
      const tree = newTree[newTree.length - 1]
      tree.thread = this.thread
      newTree.push(tree)
      if (tree.branches.length) {
        // Add a random child
        const branch = tree.pickBranch()
        branch.thread = this.thread
        await branch.run(props, newTree, description, summary, instant)
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
