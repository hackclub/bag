import { PromiseClient, createPromiseClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-node'
import { ElizaService } from '../gen/eliza_connect'
import * as methods from '../gen/eliza_pb'
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
      baseUrl: options.baseUrl || 'https://bag.hackclub.com',
      httpVersion: '1.1'
    })

    const client = createPromiseClient(ElizaService, transport)
    if (!(await client.verifyKey(options)))
      throw new Error('App not found or invalid key')
    return new App(client, options.appId, options.key)
  }

  // I would do this with a cleaner for-loop, but I can't get it to be typed in TypeScript
  async createApp(request: RecursivePartial<methods.CreateAppRequest>) {
    return await this.client.createApp({
      ...this.request,
      ...request
    })
  }

  async createInstance(
    request: RecursivePartial<methods.CreateInstanceRequest>
  ) {
    return await this.client.createInstance({
      ...this.request,
      ...request
    })
  }

  async createItem(request: RecursivePartial<methods.CreateItemRequest>) {
    return await this.client.createItem({
      ...this.request,
      ...request
    })
  }

  async createRecipe(request: RecursivePartial<methods.CreateRecipeRequest>) {
    return await this.client.createRecipe({
      ...this.request,
      ...request
    })
  }

  async createTrade(request: RecursivePartial<methods.CreateTradeRequest>) {
    return await this.client.createTrade({
      ...this.request,
      ...request
    })
  }

  async readIdentity(request: RecursivePartial<methods.ReadIdentityRequest>) {
    return await this.client.readIdentity({
      ...this.request,
      ...request
    })
  }

  async readItem(request: RecursivePartial<methods.ReadItemRequest>) {
    return await this.client.readItem({
      ...this.request,
      ...request
    })
  }

  async readInstance(request: RecursivePartial<methods.ReadInstanceRequest>) {
    return await this.client.readInstance({
      ...this.request,
      ...request
    })
  }

  async readApp(request: RecursivePartial<methods.ReadAppRequest> = {}) {
    return await this.client.readApp({
      ...this.request,
      ...request
    })
  }

  async readTrade(request: RecursivePartial<methods.ReadTradeRequest>) {
    return await this.client.readTrade({
      ...this.request,
      ...request
    })
  }

  async readRecipe(request: RecursivePartial<methods.ReadRecipeRequest>) {
    return await this.client.readRecipe({
      ...this.request,
      ...request
    })
  }

  async updateIdentityMetadata(
    request: RecursivePartial<methods.UpdateIdentityMetadataRequest>
  ) {
    return await this.client.updateIdentityMetadata({
      ...this.request,
      ...request
    })
  }

  async updateInstance(
    request: RecursivePartial<methods.UpdateInstanceRequest>
  ) {
    return await this.client.updateInstance({
      ...this.request,
      ...request
    })
  }

  async updateItem(request: RecursivePartial<methods.UpdateItemRequest>) {
    return await this.client.updateItem({
      ...this.request,
      ...request
    })
  }

  async updateApp(request: RecursivePartial<methods.UpdateAppRequest>) {
    const response = await this.client.updateApp({
      ...this.request,
      ...request
    })
    return response
  }

  async updateTrade(request: RecursivePartial<methods.UpdateTradeRequest>) {
    return await this.client.updateTrade({
      ...this.request,
      ...request
    })
  }

  async updateRecipe(request: RecursivePartial<methods.UpdateRecipeRequest>) {
    return await this.client.updateRecipe({
      ...this.request,
      ...request
    })
  }

  async deleteApp(request: RecursivePartial<methods.DeleteAppRequest>) {
    return await this.client.deleteApp({
      ...this.request,
      ...request
    })
  }

  async deleteInstance(
    request: RecursivePartial<methods.DeleteInstanceRequest>
  ) {
    return await this.client.deleteInstance({
      ...this.request,
      ...request
    })
  }

  async closeTrade(request: RecursivePartial<methods.CloseTradeRequest>) {
    return await this.client.closeTrade({
      ...this.request,
      ...request
    })
  }
}
