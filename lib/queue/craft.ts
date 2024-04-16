import { craft } from '../db'
import { prisma } from '../db'
import web from '../slack/slack'
import { showCrafting } from '../slack/views'
import { Scheduler, ms } from './queue'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'

dayjs.extend(duration)

const progressBarLength = 10
const placeholders = [
  'Crafting',
  'Combining',
  'Thinking',
  'Walking across the road'
]
const delay = ms(0, 0, 5)

export const scheduler = Scheduler(
  'craft',
  ms(0, 0, 1),
  async ({
    slack,
    craftingId,
    recipeId,
    thread,
    callbackUrl,
    time,
    current = 0
  }: {
    slack: string
    craftingId: number
    recipeId: number
    thread?: { channel: string; ts: string }
    callbackUrl?: string
    current: number
    time: number
  }) => {
    const crafting = await prisma.crafting.findUnique({
      where: { id: craftingId },
      include: {
        inputs: true,
        recipe: {
          include: {
            inputs: { include: { recipeItem: true } },
            tools: { include: { recipeItem: true } },
            outputs: { include: { recipeItem: true } }
          }
        }
      }
    })

    if (!crafting) return false

    if (current >= time) {
      // Time's up! Craft the item and notify the user
      const outputs = await craft(slack, craftingId, recipeId)
      if (thread) {
        web.client.chat.update({
          ...thread,
          blocks: await showCrafting(slack, craftingId, thread)
        })
        web.client.chat.postEphemeral({
          ...thread,
          user: slack,
          text: `<@${slack}> crafting completed!`
        })
        return false
      } else if (callbackUrl) {
        // Fetch callback
        try {
          await fetch(callbackUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ outputs })
          })
        } catch {}
      }
    }

    // Otherwise, delay
    current += delay

    if (thread) {
      const percent = Math.floor((current / time) * progressBarLength)

      let progressBar = []
      for (let i = 0; i < progressBarLength; i++) {
        if (i < percent) progressBar.push(':tw_white_medium_square:')
        else progressBar.push(':tw_black_medium_square:')
      }

      const { recipe } = crafting
      const outputsFormatted = recipe.outputs
        .map(
          output =>
            `x${output.quantity} ${output.recipeItem.reaction} ${output.recipeItem.name}`
        )
        .join(', ')

      await web.client.chat.update({
        ...thread,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `<@${slack}> is currently crafting ${outputsFormatted}.\n>${
                crafting.recipe.description
              }\n\n${progressBar.join('')} :loading-dots: ${
                placeholders[Math.floor(Math.random() * placeholders.length)]
              }\n\n_${dayjs
                .duration({
                  milliseconds: time - current
                })
                .asSeconds()} seconds remaining._`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Cancel'
                },
                value: JSON.stringify({
                  craftingId,
                  ...thread,
                  running: true
                }),
                style: 'danger',
                action_id: 'cancel-crafting'
              }
            ]
          }
        ]
      })
      return true
    }
  },
  async (craft: {
    slack: string
    craftingId: number
    recipeId: number
    thread?: { channel: string; ts: string }
    callbackUrl?: string
    time: number
    current: number
  }) => {
    const crafting = await prisma.crafting.findUnique({
      where: { id: craft.craftingId }
    })
    if (crafting && craft.current !== craft.time)
      scheduler.schedule(
        {
          ...craft,
          current: craft.current + delay
        },
        new Date().getTime() + delay
      )
  }
)

scheduler.start()
