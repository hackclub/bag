import web from '../slack/slack'
import { Scheduler, ms } from './queue'
import { ActionInstance } from '@prisma/client'
import { App, type Block, type KnownBlock } from '@slack/bolt'

const delay = ms(0, 0, 5)

export const scheduler = Scheduler(
  'use',
  ms(0, 0, 1),
  async ({
    action,
    trees,
    branch,
    description,
    summary,
    tag
  }: {
    action: ActionInstance
    trees: Results[]
    branch: Results
    description: string[]
    summary: {
      outputs: Array<[number, string]>
      losses: Array<[number, string]>
    }
    tag: string
  }) => {
    try {
      let results = await branch.run(web, trees, description, summary)
      trees = results
      if (branch.terminate) return false
    } catch (error) {
      if (error.code === 'slack_webapi_platform_error')
        // Error triggered by running cancel-use action, so exit
        return false
      console.log(error)
    }
  },
  async ({
    action,
    trees,
    branch,
    description,
    summary,
    tag
  }: {
    action: ActionInstance
    trees: Results[]
    branch: Results
    description: string[]
    summary: { outputs: Array<string>; losses: Array<string> }
    tag: string
  }) => {
    if (!trees[trees.length - 1].branches.length) {
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
      await web.client.chat.update({
        ...trees[trees.length - 1].thread,
        blocks: showAction(action, description, true)
      })
    } else {
      // Not over yet - delay appropriately with previous delay and new await
      let tree = trees[trees.length - 1]
      let newBranch = tree.pickBranch()
      newBranch.thread = tree.thread
      newBranch.action = tree.action
      if (!newBranch.branches.length) newBranch.delay = 0
      scheduler.schedule(
        {
          action,
          trees,
          branch: newBranch,
          description,
          summary,
          tag
        },
        new Date().getTime() +
          (Array.isArray(branch.delay)
            ? random(...branch.delay)
            : branch.delay) +
          (Array.isArray(newBranch.await)
            ? random(...newBranch.await)
            : newBranch.await)
      )
    }
  }
)

export const showAction = (
  action: ActionInstance,
  description: string[],
  done: boolean | { channel: string; ts: string }
): (Block | KnownBlock)[] => {
  let blocks: (Block | KnownBlock)[] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          description.join('\n\n') + (done === true ? '' : '\n:loading-dots:')
      }
    }
  ]
  if (done !== true)
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Cancel'
          },
          value: JSON.stringify({ id: action.id, thread: done }),
          style: 'danger',
          action_id: 'cancel-use'
        }
      ]
    })
  return blocks
}

export class Results {
  action: ActionInstance
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
    this.action = obj.action
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
            action: this.action,
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
            action: this.action,
            test: this.test
          })
        }
        return new Results({
          ...branch,
          delay: branch.delay || obj.defaultDelay
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
    // We pick based on a fraction of the sum of all frequencies for the results at this layer
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
              traverse.push(...traverse)
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
    props: App,
    prev: Array<Results>,
    description: Array<string>,
    summary: {
      outputs: Array<[number, string]>
      losses: Array<[number, string]>
    }
  ): Promise<Array<Results>> {
    let result = await this.runBranch(props, prev, description, summary)
    if (this.sequence.length)
      return await this.runSequence(props, prev, description, summary)
    return result
  }

  async runSequence(
    props: App,
    prev: Array<Results>,
    description: Array<string>,
    summary: {
      outputs: Array<[number, string]>
      losses: Array<[number, string]>
    }
  ): Promise<Array<Results>> {
    // Run sequence in order
    for (let node of this.sequence) {
      node.thread = this.thread
      let result = await node.run(props, prev, description, summary)
      if (node.branches.length) {
        // Run branches
        let branch = node.pickBranch()
        branch.thread = this.thread
        result = await branch.run(props, prev, description, summary)
      }
      if (node.break) break
      this.thread = result[result.length - 1].thread
    }

    return prev
  }

  async runBranch(
    props: App,
    prev: Array<Results>,
    description: Array<string>,
    summary: {
      outputs: Array<[number, string]>
      losses: Array<[number, string]>
    }
  ): Promise<Array<Results>> {
    // Run tree
    if (this.description) {
      description.push(this.description.trim())
      try {
        await props.client.chat.update({
          ...this.thread,
          blocks: showAction(this.action, description, this.thread)
        })
      } catch {
        // Length too long? Start a new thread
        await props.client.chat.update({
          ...this.thread,
          blocks: showAction(
            this.action,
            description.slice(0, description.length - 1),
            this.thread
          )
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
          blocks: showAction(this.action, description, this.thread),
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
        else
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

    if (this.goto) {
      // When a node with a goto completes, this action will move to the node with a matching tag
      let newTree = prev[0].search(this.goto, Infinity)
      newTree[newTree.length - 1].thread = this.thread
      return newTree
    } else if (this.gotoChildren) {
      // The gotoChildren fields acts like goto, except it skips the contents of the tagged node and instead goes to its children. This is useful most when we want to return not to a specific node, but to some randomly-selected branch directly beneath it.
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

export const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1) + min)
