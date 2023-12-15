import { ConnectRouter } from '@connectrpc/connect'
import { ElizaService } from './gen/eliza_connect'
import slack from './lib/slack/routes'
import { log, err } from './lib/logger'
import { Apps, Items } from './db/client'
import { mappedPermissionValues } from './lib/permissions'

export async function execute(
  req: any,
  func: (req: any, app: Apps) => any,
  permission?: number
) {
  try {
    let app = await Apps.find({ id: req.appId, AND: [{ key: req.key }] })
    if (!app) throw new Error('App not found or invalid app key')
    if (mappedPermissionValues[app.permissions] < permission) return
    const result = await func(req, app)
    return result
  } catch (error) {
    err(error)
    return { response: error.toString() }
  }
}

export default (router: ConnectRouter) => {
  router.rpc(ElizaService, ElizaService.methods.createInstance, async req => {
    return await execute(req, async (req, app) => {
      // Create instance of item, given permissions
      const item = await Items.find({ name: req.itemId })
      if (!item) throw new Error('Item not found')

      // Make sure app has permissions to assign specific item
      if (
        mappedPermissionValues[app.permissions] <
        mappedPermissionValues.WRITE_SPECIFIC
      )
        throw new Error(
          'App does not have the minimum permissions to be able to create instances; please request permissions for your app in Slack by running'
        )
      else if (mappedPermissionValues.WRITE_SPECIFIC) {
        console.log(app.specific)
        return { response: 'still tryna figure it out man' }
      }

      return { id: 1, itemId: 'hi', identityId: 'hi' }
    })
  })
}
