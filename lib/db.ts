import {
  PrismaClient,
  PermissionLevels,
  Instance,
  Identity
} from '@prisma/client'
import { type JsonValue } from '@prisma/client/runtime/library'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

export class Identities {
  slack: string
  permissions: PermissionLevels
  inventory: Instances[]

  constructor(identity: {
    slack: string
    permissions: PermissionLevels
    inventory: Instances[]
  }) {
    this.slack = identity.slack
    this.permissions = identity.permissions
    this.inventory = identity.inventory
  }

  async update(options: {
    permissions?: PermissionLevels
    inventory?: Instances[]
  }) {
    await prisma.identity.update({
      where: {
        slack: this.slack
      },
      // @ts-ignore-error
      data: options  
    })

    if (options.permissions !== undefined)
      this.permissions = options.permissions
    if (options.inventory !== undefined) this.inventory = options.inventory
  }

  async giveInstance(itemId: string) {
    // Give instance to user
    const item = await Items.find({
      name: itemId
    })

    // Create instance from item
    // const instance = await Instances.create(this, item)
    // this.inventory.push(instance)
    // await prisma.identity.upsert({
    //   where: {
    //     slack: this.slack
    //   },
    //   create: {
    //     inventory: { connect: instance.id }
    //   }
    // })
  }

  static async create(id: string): Promise<Identities> {
    const identity = await prisma.identity.create({
      data: {
        slack: id
      },
      include: {
        inventory: true
      }
    })
    return new Identities({
      ...identity,
      inventory: identity.inventory.map(instance => new Instances(instance))
    })
  }

  static async find() {}

  static async all(): Promise<Identities[]> {
    const identities = await prisma.identity.findMany({
      include: {
        inventory: true
      }
    })
    return identities.map(identity => new Identities(identity))
  }
}

export class Items {
  name: string
  image: string
  description: string
  reaction: string
  commodity: boolean
  tradable: boolean
  instances: Instances[]
  public: boolean
  metadata: JsonValue

  constructor(item: {
    name: string
    image?: string
    description?: string
    reaction?: string
    commodity: boolean
    tradable: boolean
    instances?: Instances[]
    public: boolean
    metadata?: JsonValue
  }) {
    this.name = item.name
    this.image = item.image || ''
    this.description = item.description || ''
    this.reaction = item.reaction || ''
    this.commodity = item.commodity
    this.tradable = item.tradable
    this.instances = item.instances || []
    this.public = item.public
    this.metadata = item.metadata || {}
  }

  async populate() {}

  async update(options: {
    name?: string
    image?: string
    description?: string
    reaction?: string
    commodity?: boolean
    tradable?: boolean
    instances?: Instances[]
    public?: boolean
    metadata?: JsonValue
  }) {
    await prisma.item.update({
      where: {
        name: this.name
      },
      data: 
    })
  }

  static async create() {}

  static async find() {}

  static async all() {}
}

export class Instances {
  id: number
  itemId: string
  identityId: string
  item: Items
  identity: Identity
  quantity: number
  metadata: JsonValue
  initiatorTrades: Trades[]
  receiverTrades: Trades[]
  public: boolean

  constructor(instance: {
    id: number
    itemId: string
    identityId: string
    quantity?: number
    metadata?: JsonValue
    public: boolean
  }) {
    this.id = instance.id
    this.itemId = instance.itemId
    this.identityId = instance.identityId
    this.quantity = instance.quantity || 1
    this.metadata = instance.metadata || {}
    this.public = instance.public
  }

  async populate() {
    // Populate this.item and this.identity
    // TODO
  }

  static async create(
    identityId: string,
    itemId: string,
    quantity: number = 1
  ): Promise<Instances> {
    return new Instances(
      await prisma.instance.create({
        data: {
          identityId,
          itemId,
          quantity
        }
      })
    )
  }

  static async find(instanceId: number): Promise<Instances> {
    const result = await prisma.instance.findUnique({
      where: {
        id: instanceId
      },
      include: {
        identity: true,
        item: true
      }
    })

    if (result) return new Instances(result)
  }

  static async deleteInstance(instanceId: number): Promise<Instances> {
    const result = await prisma.instance.delete({
      where: {
        id: instanceId
      }
    })

    if (result) return new Instances(result)
  }
}

export class Apps {
  id: number
  name: string
  description: string
  permissions: PermissionLevels
  specific: string[]
  public: boolean
  metadata: JsonValue

  constructor(app: {
    id: number
    name: string
    description?: string
    permissions?: PermissionLevels
    specific?: string[]
    public: boolean
    metadata?: JsonValue
  }) {
    this.id = app.id
    this.name = app.name
    this.description = app.description || ''
    this.specific = app.specific || []
    this.public = app.public
    this.metadata = app.metadata || {}
  }

  async update(options: {
    name?: string
    description?: string
    permissions?: PermissionLevels
    specific?: string[]
    public?: boolean
    metadata?: JsonValue
  }) {
    await prisma.app.update({
      where: {
        name: this.name
      },
      data: options
    })

    if (options.name !== undefined) this.name = options.name
  }

  static async create() {}

  static async find() {}

  static async all() {}
}

export class Trades {
  id: number
  initiatorIdentityId: string
  receiverIdentityId: string
  initiator: Identities
  receiver: Identities
  initiatorTrades: Instances[]
  receiverTrades: Instance[]
  public: boolean
  closed: boolean

  constructor() {}

  async populate() {}

  async update() {}

  async close() {}

  static async open() {}

  static async find() {}

  static async all() {}
}
