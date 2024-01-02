import { createPromiseClient } from '@connectrpc/connect'
import {
  createGrpcTransport,
  createConnectTransport
} from '@connectrpc/connect-node'
import { ElizaService } from '../gen/eliza_connect'
import 'dotenv/config'

async function app() {
  const transport = createConnectTransport({
    baseUrl: 'http://localhost:3000',
    httpVersion: '1.1'
  })

  const client = createPromiseClient(ElizaService, transport)
  const key = process.env.EASTEREGG_APP_KEY // App key for Easter Egg is stored at TEST_APP_KEY, for the sake of testing

  // Send an Easter egg to me
  const response = await client.createInstance({
    key,
    appId: 1,
    itemId: 'Easter Egg',
    identityId: 'U03MNFDRSGJ'
  })
  console.log(response)
}

app()
