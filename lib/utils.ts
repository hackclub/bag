import { prisma } from './db'
import fs from 'fs'
import path from 'path'
import { parse } from 'yaml'

const maintainersYaml = fs.readFileSync(
  path.join(process.cwd(), './maintainers.yaml'),
  'utf-8'
)
export const maintainers = parse(maintainersYaml)

const channelsYaml = fs.readFileSync(
  path.join(process.cwd(), './blacklist.yaml'),
  'utf-8'
)
export const channelBlacklist = parse(channelsYaml)

export const channels = {
  approvals: 'C06EB2Y3YAE',
  lounge: 'C0266FRGV'
}

export const getKeyByValue = (obj, value) =>
  Object.keys(obj).find(key => obj[key] === value)

export const userRegex = /^<@[\s\S]+\|[\s\S]+>$/gm

export const beingUsed = async (userId: string) => {
  // Remove all impossible inventory items: that is, items currently being used in trades or crafting.
  const user = await prisma.identity.findUnique({
    where: { slack: userId },
    include: { inventory: true }
  })

  let available = []
  let inTrades = []
  let inCrafting = []
  await Promise.all(
    user.inventory.map(async instance => {
      // Check if offering in trade
      const trades = await prisma.trade.findMany({
        where: {
          closed: false, // Not closed
          OR: [
            { initiatorTrades: { some: { instanceId: instance.id } } },
            { receiverTrades: { some: { instanceId: instance.id } } }
          ] // Either in initiatorTrades or receiverTrades
        },
        include: {
          initiatorTrades: true,
          receiverTrades: true
        }
      })
      let offers = trades
        .map(offer => ({
          ...offer,
          trades: [...offer.initiatorTrades, ...offer.receiverTrades]
        }))
        .filter(offer =>
          offer.trades.find(trade => trade.instanceId === instance.id)
        )
    })
  )
}
