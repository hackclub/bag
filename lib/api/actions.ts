import { BagService } from '../../gen/bag_connect'
import { prisma } from '../db'
import { mappedPermissionValues } from '../permissions'
import { execute } from './routing'
import { ConnectRouter } from '@connectrpc/connect'

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.createAction, async req => {
    return await execute(
      req,
      async req => {
        return {
          action: await prisma.action.create({
            data: {
              locations: req.action.locations,
              tools: req.action.tools.map(tool => tool.toLowerCase()),
              branch: JSON.parse(req.action.branch)
            }
          })
        }
      },
      mappedPermissionValues.ADMIN,
      true
    )
  })

  router.rpc(BagService, BagService.methods.readAction, async req => {
    return await execute(req, async req => {
      let actions = await prisma.action.findMany({
        where: {
          locations: { hasSome: req.query.locations },
          tools: { hasSome: req.query.tools.map(tool => tool.toLowerCase()) },
          branch: req.query.branch
            ? { equals: JSON.parse(req.query.branch) }
            : undefined
        }
      })
      return { actions }
    })
  })

  router.rpc(BagService, BagService.methods.updateAction, async req => {
    return await execute(
      req,
      async req => {
        return {
          action: await prisma.action.update({
            where: { id: req.actionId },
            data: {
              locations: req.new.locations,
              tools: req.new.tools.map(tool => tool.toLowerCase()),
              branch: JSON.parse(req.new.branch)
            }
          })
        }
      },
      mappedPermissionValues.ADMIN
    )
  })
}
