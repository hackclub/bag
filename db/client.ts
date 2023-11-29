import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanup() {
  await prisma.$disconnect()
}

export async function createSlackUser(id: string) {
  const user = await prisma.identity.create({
    data: {
      slack: id
    }
  })
  return user
}

export class Identity {}

export default prisma
