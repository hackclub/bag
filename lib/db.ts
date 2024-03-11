// Type helpers for Prisma
import { Prisma, PrismaClient } from '@prisma/client'

const prismaClient = () => new PrismaClient()

declare global {
  var prisma: undefined | ReturnType<typeof prismaClient>
}

export const prisma = globalThis.prisma ?? prismaClient()

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
