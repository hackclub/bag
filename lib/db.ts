// Type helpers for Prisma
import { Prisma, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// @ts-ignore-error
const identityWithInventory = Prisma.validator<Prisma.IdentityDefaultArgs>()({
  include: { inventory: true }
})

export type IdentityWithInventory = Prisma.IdentityGetPayload<
  typeof identityWithInventory
>

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
