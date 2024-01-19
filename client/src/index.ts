import { ElizaService } from '../gen/eliza_connect'
import * as methods from '../gen/eliza_pb'
import { PromiseClient, createPromiseClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-node'
import 'dotenv/config'

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
  private client: PromiseClient<typeof ElizaService>
  private request: { appId: number; key: string }

  constructor(
    client: PromiseClient<typeof ElizaService>,
    appId: number,
    key: string
  ) {
    this.client = client
    this.request = { appId, key }
  }

  static async connect(options: {
    appId: number
    key: string
    baseUrl?: string
  }) {
    const transport = createConnectTransport({
      baseUrl: options.baseUrl
        ? options.baseUrl
        : 'https://bag-client.hackclub.com',
      httpVersion: '1.1'
    })

    const client = createPromiseClient(ElizaService, transport)
    if (!(await client.verifyKey(options)))
      throw new Error('App not found or invalid key')
    return new App(client, options.appId, options.key)
  }

  static format(obj: any) {
    // Format: convert metadata to JSON, etc.
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
  async createApp(request: RecursivePartial<methods.CreateAppRequest>) {
    return App.format(
      await this.client.createApp({
        ...this.request,
        ...request
      })
    )
  }

  async createInstance(
    request: RecursivePartial<methods.CreateInstanceRequest>
  ) {
    return App.format(
      await this.client.createInstance({
        ...this.request,
        ...request
      })
    )
  }

  async createItem(request: RecursivePartial<methods.CreateItemRequest>) {
    return App.format(
      await this.client.createItem({
        ...this.request,
        ...request
      })
    )
  }

  async createRecipe(request: RecursivePartial<methods.CreateRecipeRequest>) {
    return App.format(
      await this.client.createRecipe({
        ...this.request,
        ...request
      })
    )
  }

  async createTrade(request: RecursivePartial<methods.CreateTradeRequest>) {
    return App.format(
      await this.client.createTrade({
        ...this.request,
        ...request
      })
    )
  }

  async readIdentity(request: RecursivePartial<methods.ReadIdentityRequest>) {
    return App.format(
      await this.client.readIdentity({
        ...this.request,
        ...request
      })
    )
  }

  async readInventory(request: RecursivePartial<methods.ReadInventoryRequest>) {
    return App.format(
      await this.client.readInventory({
        ...this.request,
        ...request
      })
    )
  }

  async readItem(request: RecursivePartial<methods.ReadItemRequest>) {
    return App.format(
      await this.client.readItem({
        ...this.request,
        ...request
      })
    )
  }

  async readInstance(request: RecursivePartial<methods.ReadInstanceRequest>) {
    return App.format(
      await this.client.readInstance({
        ...this.request,
        ...request
      })
    )
  }

  async readApp(request: RecursivePartial<methods.ReadAppRequest> = {}) {
    return App.format(
      await this.client.readApp({
        ...this.request,
        ...request
      })
    )
  }

  async readTrade(request: RecursivePartial<methods.ReadTradeRequest>) {
    return App.format(
      await this.client.readTrade({
        ...this.request,
        ...request
      })
    )
  }

  async readRecipe(request: RecursivePartial<methods.ReadRecipeRequest>) {
    return App.format(
      await this.client.readRecipe({
        ...this.request,
        ...request
      })
    )
  }

  async updateIdentityMetadata(
    request: RecursivePartial<methods.UpdateIdentityMetadataRequest>
  ) {
    return App.format(
      await this.client.updateIdentityMetadata({
        ...this.request,
        ...request
      })
    )
  }

  async updateInstance(
    request: RecursivePartial<methods.UpdateInstanceRequest>
  ) {
    return App.format(
      await this.client.updateInstance({
        ...this.request,
        ...request
      })
    )
  }

  async updateItem(request: RecursivePartial<methods.UpdateItemRequest>) {
    return App.format(
      await this.client.updateItem({
        ...this.request,
        ...request
      })
    )
  }

  async updateApp(request: RecursivePartial<methods.UpdateAppRequest>) {
    return App.format(
      await this.client.updateApp({
        ...this.request,
        ...request
      })
    )
  }

  async updateTrade(request: RecursivePartial<methods.UpdateTradeRequest>) {
    return App.format(
      await this.client.updateTrade({
        ...this.request,
        ...request
      })
    )
  }

  async updateRecipe(request: RecursivePartial<methods.UpdateRecipeRequest>) {
    return App.format(
      await this.client.updateRecipe({
        ...this.request,
        ...request
      })
    )
  }

  async deleteApp(request: RecursivePartial<methods.DeleteAppRequest>) {
    return App.format(
      await this.client.deleteApp({
        ...this.request,
        ...request
      })
    )
  }

  async deleteInstance(
    request: RecursivePartial<methods.DeleteInstanceRequest>
  ) {
    return App.format(
      await this.client.deleteInstance({
        ...this.request,
        ...request
      })
    )
  }

  async closeTrade(request: RecursivePartial<methods.CloseTradeRequest>) {
    return App.format(
      await this.client.closeTrade({
        ...this.request,
        ...request
      })
    )
  }
}
