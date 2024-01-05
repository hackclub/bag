import { PromiseClient, createPromiseClient } from '@connectrpc/connect'
import { createConnectTransport } from '@connectrpc/connect-node'
import { ElizaService } from '../gen/eliza_connect' // TODO: This also needs to be exported in the package and should have a build command
import 'dotenv/config'

export class App {
  client: PromiseClient<typeof ElizaService>
  appId: number
  key: string

  constructor(
    client: PromiseClient<typeof ElizaService>,
    appId: number,
    key: string
  ) {
    this.client = client
    this.appId = appId
    this.key = key
  }

  static async connect(appId: number, key: string) {
    const transport = createConnectTransport({
      baseUrl: 'http://localhost:3000',
      httpVersion: '2'
    })

    const client = createPromiseClient(ElizaService, transport)
    if (!(await client.verifyKey({ appId, key })))
      throw new Error('App not found or invalid app key')
    return new App(client, appId, key)
  }
}
