import { ConnectRouter } from '@connectrpc/connect'
import { ElizaService } from './gen/eliza_connect'

export default (router: ConnectRouter) =>
  router.service(ElizaService, {
    async say() {
      return { response: 'ok' }
    },
    async addSlackAction(call) {
      console.log('ebfdskfdsnk')
      return { response: 'ok' }
    }
  })
