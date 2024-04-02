// Type helpers for Prisma
import { Instance, Prisma, PrismaClient } from '@prisma/client'

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

export const craft = async (
  slack: string,
  craftingId: number,
  recipeId: number
): Promise<Instance[]> => {
  const crafting = await prisma.crafting.findUnique({
    where: { id: craftingId }
  })

  const updated = await prisma.crafting.update({
    where: { id: craftingId },
    data: { recipeId },
    include: {
      recipe: {
        include: {
          inputs: true,
          tools: true,
          outputs: { include: { recipeItem: true } }
        }
      },
      inputs: { include: { instance: true } }
    }
  })

  // Deduce inputs (not tools) from users' inventory
  for (let part of updated.recipe.inputs) {
    const instance = updated.inputs.find(
      instance => instance.recipeItemId === part.recipeItemId
    )
    if (part.quantity < instance.instance.quantity)
      // Subtract from quantity
      await prisma.instance.update({
        where: { id: instance.instanceId },
        data: { quantity: instance.instance.quantity - part.quantity }
      })
    // Detach entire instance
    else
      await prisma.instance.update({
        where: { id: instance.instanceId },
        data: {
          identity: { disconnect: true }
        }
      })
  }

  let outputs: Instance[] = []

  // Give user the output
  for (let output of updated.recipe.outputs) {
    // Check if user already has an instance and add to that instance
    const existing = await prisma.instance.findFirst({
      where: {
        identityId: slack,
        itemId: output.recipeItemId
      }
    })

    if (existing)
      outputs.push(
        await prisma.instance.update({
          where: { id: existing.id },
          data: { quantity: output.quantity + existing.quantity }
        })
      )
    else
      outputs.push(
        await prisma.instance.create({
          data: {
            itemId: output.recipeItemId,
            identityId: crafting.identityId,
            quantity: output.quantity,
            public: output.recipeItem.public
          }
        })
      )
  }

  return outputs
}
