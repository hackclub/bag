import * as grpc from '@grpc/grpc-js'
import type { ServiceClient } from '@grpc/grpc-js/build/src/make-client'
import path from 'path'

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? RecursivePartial<U>[]
    : T[P] extends object | undefined
      ? RecursivePartial<T[P]>
      : T[P]
}

export const Permissions = {
  ADMIN: 4,
  WRITE: 3,
  WRITE_SPECIFIC: 2,
  READ_PRIVATE: 1,
  READ: 0
}

export class App {
  private client: ServiceClient
  private request: { appId: number; key: string }

  constructor(client: ServiceClient, appId: number, key: string) {
    this.client = client
    this.request = { appId, key }
  }

  static async connect(options: {
    appId: number
    key: string
    baseUrl?: string
    protoLocation?: string
  }) {
    const PROTO_PATH =
      options.protoLocation || path.join(__dirname, '/proto/bag.proto')
    const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true
    })

    const protoDescriptor = grpc.loadPackageDefinition(packageDefinition)
    // @ts-expect-error
    const { BagService } = protoDescriptor.bag
    const client: ServiceClient = new BagService(
      options.baseUrl || 'https://bag-client.hackclub.com',
      grpc.credentials.createInsecure()
    )

    return new Promise((resolve, reject) => {
      const callback = (error, response) => {
        if (error) return reject(error)
        if (!response.valid) throw new Error('App not found or invalid key')
        return resolve(new App(client, options.appId, options.key))
      }
      client.verifyKey({ appId: options.appId, key: options.key }, callback)
    })
  }

  static format(obj: any) {
    // Format: convert metadata to JSON, etc.
    if (obj.response) throw new Error(obj.response)
    for (let [entry, value] of Object.entries(obj)) {
      if (entry === 'metadata') {
        obj[entry] = JSON.parse(value as string)
        if (typeof obj[entry] === 'string')
          obj[entry] = JSON.parse(obj[entry] as string)
      } else if (value instanceof Object) obj[entry] = App.format(value)
    }
    return obj
  }

  // I would do this with a cleaner for-loop, but I can't get it to be typed in TypeScript
  async createApp(request) {
    return new Promise((resolve, reject) => {
      this.client.createApp(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async createInstances(request) {
    return new Promise((resolve, reject) => {
      this.client.createInstances(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async createInstance(request) {
    return new Promise((resolve, reject) => {
      this.client.createInstance(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async createItem(request) {
    return new Promise((resolve, reject) => {
      this.client.createItem(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async createRecipe(request) {
    return new Promise((resolve, reject) => {
      this.client.createRecipe(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async createTrade(request) {
    return new Promise((resolve, reject) => {
      this.client.createTrade(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async readIdentity(request) {
    return new Promise((resolve, reject) => {
      this.client.readIdentity(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async readInventory(request) {
    return new Promise((resolve, reject) => {
      this.client.readInventory(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async readItem(request) {
    return new Promise((resolve, reject) => {
      this.client.readItem(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async readInstance(request) {
    return new Promise((resolve, reject) => {
      this.client.readInstance(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async readApp(request) {
    return new Promise((resolve, reject) => {
      this.client.readApp(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async readTrade(request) {
    return new Promise((resolve, reject) => {
      this.client.readTrade(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async readRecipe(request) {
    return new Promise((resolve, reject) => {
      this.client.readRecipe(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async updateIdentityMetadata(request) {
    return new Promise((resolve, reject) => {
      this.client.updateIdentityMetadata(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async updateInstance(request) {
    return new Promise((resolve, reject) => {
      this.client.updateInstance(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async updateItem(request) {
    return new Promise((resolve, reject) => {
      this.client.updateItem(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async updateApp(request) {
    return new Promise((resolve, reject) => {
      this.client.updateApp(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async updateTrade(request) {
    return new Promise((resolve, reject) => {
      this.client.updateTrade(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async updateRecipe(request) {
    return new Promise((resolve, reject) => {
      this.client.updateRecipe(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async deleteApp(request) {
    return new Promise((resolve, reject) => {
      this.client.deleteApp(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async deleteInstance(request) {
    return new Promise((resolve, reject) => {
      this.client.deleteInstance(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }

  async closeTrade(request) {
    return new Promise((resolve, reject) => {
      this.client.closeTrade(
        {
          ...this.request,
          ...request
        },
        (error, result) => {
          if (error) return reject(error)
          else return resolve(App.format(result))
        }
      )
    })
  }
}
