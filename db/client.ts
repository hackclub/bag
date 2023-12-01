import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export class Identities {
  static async valid(id: string) {
    // Validate Slack ID
  }

  // C
  static async create(id: string) {
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

interface Item {
  name: string
  image: string
  description: string
  reaction: string
  commodity: boolean
  tradable: boolean
}

export class Items {
  static async create(options: Item) {
    return await prisma.item.create({
      data: {
        ...options
      }
    })
  }

  static async createMany(items: Item[]) {
    return await prisma.item.createMany({
      data: {
        ...items
      }
    })
  }
}

export class App {
  // Class for managing permissions for apps that might extend from this
}

export default prisma
