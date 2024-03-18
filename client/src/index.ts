import { BagService } from '../gen/bag_connect'
import * as methods from '../gen/bag_pb'
import { PromiseClient, createPromiseClient } from '@connectrpc/connect'
import { createGrpcTransport } from '@connectrpc/connect-node'
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
  private client: PromiseClient<typeof BagService>
  private request: { appId: number; key: string }

  constructor(
    client: PromiseClient<typeof BagService>,
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
    httpVersion?: any
  }) {
    let transport = createGrpcTransport({
      baseUrl: options.baseUrl
        ? options.baseUrl
        : 'https://bag-client.hackclub.com',
      httpVersion: options.httpVersion ? options.httpVersion : '2'
    })

    const client = createPromiseClient(BagService, transport)
    if (!(await client.verifyKey(options)))
      throw new Error('App not found or invalid key')
    return new App(client, options.appId, options.key)
  }

  static format(obj: any) {
    // Format: convert metadata to JSON, etc.
    if (!obj) return obj
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
  async createApp(request: RecursivePartial<methods.CreateAppRequest>) {
    return App.format(
      await this.client.createApp({
        ...this.request,
        ...request
      })
    ).app
  }

  async createInstances(
    request: RecursivePartial<methods.CreateInstancesRequest>
  ) {
    return App.format(
      await this.client.createInstances({
        ...this.request,
        ...request
      })
    ).instances
  }

  async createInstance(
    request: RecursivePartial<methods.CreateInstanceRequest>
  ) {
    return App.format(
      await this.client.createInstance({
        ...this.request,
        ...request
      })
    ).instance
  }

  async createItem(request: RecursivePartial<methods.CreateItemRequest>) {
    return App.format(
      await this.client.createItem({
        ...this.request,
        ...request
      })
    ).item
  }

  async createRecipe(request: RecursivePartial<methods.CreateRecipeRequest>) {
    return App.format(
      await this.client.createRecipe({
        ...this.request,
        ...request
      })
    ).recipe
  }

  async createTrade(request: RecursivePartial<methods.CreateTradeRequest>) {
    return App.format(
      await this.client.createTrade({
        ...this.request,
        ...request
      })
    ).trade
  }

  async createAction(request: RecursivePartial<methods.CreateActionRequest>) {
    return App.format(
      await this.client.createAction({
        ...this.request,
        ...request
      })
    ).action
  }

  async getIdentity(request: RecursivePartial<methods.GetIdentityRequest>) {
    return App.format(
      await this.client.getIdentity({
        ...this.request,
        ...request
      })
    ).identity
  }

  async getInventory(request: RecursivePartial<methods.GetInventoryRequest>) {
    return App.format(
      await this.client.getInventory({
        ...this.request,
        ...request
      })
    ).inventory
  }

  async getItem(request: RecursivePartial<methods.GetItemRequest>) {
    return App.format(
      await this.client.getItem({
        ...this.request,
        ...request
      })
    ).item
  }

  async getItems(request: RecursivePartial<methods.GetItemsRequest>) {
    return App.format(
      await this.client.getItems({
        ...this.request,
        ...request
      })
    ).items
  }

  async getInstance(request: RecursivePartial<methods.GetInstanceRequest>) {
    return App.format(
      await this.client.getInstance({
        ...this.request,
        ...request
      })
    ).instance
  }

  async getApp(request: RecursivePartial<methods.GetAppRequest> = {}) {
    return App.format(
      await this.client.getApp({
        ...this.request,
        ...request
      })
    ).app
  }

  async getTrade(request: RecursivePartial<methods.GetTradeRequest>) {
    return App.format(
      await this.client.getTrade({
        ...this.request,
        ...request
      })
    ).trade
  }

  async getRecipes(request: RecursivePartial<methods.GetRecipesRequest>) {
    return App.format(
      await this.client.getRecipes({
        ...this.request,
        ...request
      })
    ).recipes
  }

  async getRecipe(request: RecursivePartial<methods.GetRecipeRequest>) {
    return App.format(
      await this.client.getRecipe({
        ...this.request,
        ...request
      })
    ).recipe
  }

  async getAction(request: RecursivePartial<methods.GetActionRequest>) {
    return App.format(
      await this.client.getAction({
        ...this.request,
        ...request
      })
    ).actions
  }

  async updateIdentityMetadata(
    request: RecursivePartial<methods.UpdateIdentityMetadataRequest>
  ) {
    return App.format(
      await this.client.updateIdentityMetadata({
        ...this.request,
        ...request
      })
    ).identity
  }

  async updateInstance(
    request: RecursivePartial<methods.UpdateInstanceRequest>
  ) {
    return App.format(
      await this.client.updateInstance({
        ...this.request,
        ...request
      })
    ).instance
  }

  async updateItem(request: RecursivePartial<methods.UpdateItemRequest>) {
    return App.format(
      await this.client.updateItem({
        ...this.request,
        ...request
      })
    ).item
  }

  async updateApp(request: RecursivePartial<methods.UpdateAppRequest>) {
    return App.format(
      await this.client.updateApp({
        ...this.request,
        ...request
      })
    ).app
  }

  async updateTrade(request: RecursivePartial<methods.UpdateTradeRequest>) {
    return App.format(
      await this.client.updateTrade({
        ...this.request,
        ...request
      })
    ).trade
  }

  async updateRecipe(request: RecursivePartial<methods.UpdateRecipeRequest>) {
    return App.format(
      await this.client.updateRecipe({
        ...this.request,
        ...request
      })
    ).recipe
  }

  async updateAction(request: RecursivePartial<methods.UpdateActionRequest>) {
    return App.format(
      await this.client.updateAction({
        ...this.request,
        ...request
      })
    ).action
  }

  async deleteApp(request: RecursivePartial<methods.DeleteAppRequest>) {
    return App.format(
      await this.client.deleteApp({
        ...this.request,
        ...request
      })
    ).deletedApp
  }

  async deleteInstance(
    request: RecursivePartial<methods.DeleteInstanceRequest>
  ) {
    return App.format(
      await this.client.deleteInstance({
        ...this.request,
        ...request
      })
    ).deletedInstance
  }

  async closeTrade(request: RecursivePartial<methods.CloseTradeRequest>) {
    return App.format(
      await this.client.closeTrade({
        ...this.request,
        ...request
      })
    ).trade
  }
}
