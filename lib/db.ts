// Type helpers for Prisma
import { Prisma, PrismaClient, Instance, Item } from '@prisma/client'

const prisma = new PrismaClient()

// @ts-ignore-error
const identityWithInventory = Prisma.validator<Prisma.IdentityDefaultArgs>()({
  include: { inventory: true }
})
const instanceWithInventory = Prisma.validator<Prisma.InstanceDefaultArgs>()({
  include: { item: true }
})
const tradeWithTrades = Prisma.validator<Prisma.TradeDefaultArgs>()({
  include: {
    initiatorTrades: true,
    receiverTrades: true
  }
})

export type IdentityWithInventory = Prisma.IdentityGetPayload<
  typeof identityWithInventory
>
export type InstanceWithItem = Prisma.InstanceGetPayload<
  typeof instanceWithInventory
>
export type TradeWithTrades = Prisma.TradeGetPayload<typeof tradeWithTrades>

export const findOrCreateIdentity = async (
  slack: string
): Promise<IdentityWithInventory> => {
  const result = await prisma.identity.findUnique({
    where: {
      slack
    },
    include: {
      inventory: true
    }
  })

  if (!result)
    return await prisma.identity.create({
      data: {
        slack
      },
      include: {
        inventory: true
      }
    })
  return result
}

export const combineInventory = async (
  inventory: Instance[]
): Promise<[number, Instance[], Item][]> => {
  // Apply `reduce` to inventory to get rid of items that aren't unique but may have unique metadata, etc.
  let result: [number, Instance[], Item][] = []
  const reduced = inventory.reduce((acc: any, curr: Instance) => {
    const instance = acc.find(instances => instances[0].itemId == curr.itemId)
    if (instance) instance.push(curr)
    else acc.push([curr])
    return acc
  }, [])
  for (let instances of reduced) {
    const quantity = instances.reduce((acc: any, curr: Instance) => {
      return acc + curr.quantity
    }, 0)
    const ref = await prisma.item.findUnique({
      where: {
        name: instances[0].itemId
      }
    })
    result.push([quantity, instances, ref])
  }
  return result
}
