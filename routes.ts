import { ConnectRouter } from '@connectrpc/connect'
import { ElizaService } from './gen/proto/eliza_connect'

export default (router: ConnectRouter) => router.service(ElizaService, {})
