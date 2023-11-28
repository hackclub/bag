import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanup() {
  await prisma.$disconnect()
}

// TODO: Include starting

export default prisma
