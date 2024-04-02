import { BagService } from './gen/bag_connect'
import actionRoutes from './lib/api/actions'
import appRoutes from './lib/api/apps'
import botRoutes from './lib/api/bot'
import identityRoutes from './lib/api/identity'
import instanceRoutes from './lib/api/instances'
import itemRoutes from './lib/api/items'
import recipeRoutes from './lib/api/recipes'
import { execute } from './lib/api/routing'
import tradeRoutes from './lib/api/trades'
import { ConnectRouter } from '@connectrpc/connect'

const routes = [
  actionRoutes,
  appRoutes,
  identityRoutes,
  instanceRoutes,
  itemRoutes,
  recipeRoutes,
  tradeRoutes,
  botRoutes
]

export default (router: ConnectRouter) => {
  for (let kind of routes) {
    // Loop through routes and pass router in
    kind(router)
  }

  router.rpc(BagService, BagService.methods.verifyKey, async (req, context) => {
    return await execute('verify-key', req, async (_, app) => {
      if (!app) return { valid: false }
      return { valid: true }
    })
  })
}
