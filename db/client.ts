import { PrismaClient, PermissionLevels, Instance, App } from '@prisma/client'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

export class Identities {
  slack: string
  permissions: PermissionLevels
  inventory: Instance[]

  constructor(identity: {
    slack: string
    permissions: PermissionLevels
    inventory: Instance[]
  }) {
    this.slack = identity.slack
    this.permissions = identity.permissions
    this.inventory = identity.inventory
  }

  async updatePermissions(permissions: PermissionLevels) {
    this.permissions = permissions
    await prisma.identity.update({
      where: {
        slack: this.slack
      },
      data: {
        permissions
      }
    })
  }

  // C
  static async create(id: string) {
    return new Identities(
      await prisma.identity.create({
        data: {
          slack: id
        },
        include: {
          inventory: true
        }
      })
    )
  }

  static async createMany(ids: Array<string>) {
    for (let id of ids) {
      return this.create(id)
    }
  }

  // R
  static async find(id: string, create: boolean = false) {
    const result = new Identities(
      (await prisma.identity.findUnique({
        where: {
          slack: id
        },
        include: {
          inventory: true
        }
      })) ||
        (create === true && (await Identities.create(id)))
    )
    return result
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

  async giveInstance(instanceId: string) {}
}

export interface Item {
  name: string
  image: string
  description: string
  reaction: string
  commodity: boolean
  tradable: boolean
  public: boolean
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

  static async find(options: Item) {
    return await prisma.item
  }
}

export class Apps {
  // Class for managing permission for apps that might extend from this
  name: string
  description: string
  permissions: PermissionLevels

  constructor(app: App) {}

  static async create(
    name: string,
    description: string = '',
    permissions: PermissionLevels = PermissionLevels.READ
  ) {
    if (await Apps.find({ name })) throw new Error('Name is already being used')

    let key = uuid()
    while (await Apps.find({ key })) {
      // Keep generating UUID until we find a unique one
      key = uuid()
    }

    return await prisma.app.create({
      data: {
        key,
        name,
        description,
        permissions
      }
    })
  }

  static async find(options) {
    return await prisma.app.findUnique({
      where: options
    })
  }
}

export default prisma
