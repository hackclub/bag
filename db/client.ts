import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class Identity {
  // C
  static async create(id: string) {
    // Validate ID
    return await prisma.identity.create({
      data: {
        slack: id
      }
    })
  }

  static async createMany(ids: Array<string>) {
    for (let id of ids) {
      return this.create(id)
    }
  }

  // R
  static async find(id: string) {
    return await prisma.identity.findUnique({
      where: {
        slack: id
      }
    })
  }

  static async all() {
    return await prisma.identity.findMany()
  }

  // D
  static async del(id: string) {
    return await prisma.identity.delete({
      where: {
        slack: id
      }
    })
  }
}

export class App {
  // Class for managing permissions for apps that might extend from this
}

export default prisma
