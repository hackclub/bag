// Type helpers for Prisma
import { Prisma } from '@prisma/client'

// @ts-ignore-error
const identityWithInventory = Prisma.validator<Prisma.IdentityDefaultArgs>()({
  include: { inventory: true }
})

export type IdentityWithInventory = Prisma.IdentityGetPayload<
  typeof identityWithInventory
>
