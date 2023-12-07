import { ConnectRouter } from '@connectrpc/connect'
import { ElizaService } from './gen/proto/eliza_connect'

export default (router: ConnectRouter) =>
  router.service(ElizaService, {
    async say() {
      return { response: 'ok' }
    },
    async bidiSay(call) {
      call.write({ response: 'ok' })
      call.end()
    }
  })
