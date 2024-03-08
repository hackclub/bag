import { BagService } from '../../gen/bag_connect'
import { prisma } from '../db'
import { log } from '../logger'
import { mappedPermissionValues } from '../permissions'
import { execute } from './routing'
import { ConnectRouter } from '@connectrpc/connect'
import { Item, PermissionLevels } from '@prisma/client'

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.createItem, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (!req.item.name || !req.item.reaction)
          throw new Error('Required fields for new items: name, reaction')
        const item = await prisma.item.create({ data: req.item })
        log('New item created: ', item.name)
        return { item }
      },
      mappedPermissionValues.ADMIN
    )
  })

  router.rpc(BagService, BagService.methods.readItem, async req => {
    return await execute(req, async (req, app) => {
      const query = JSON.parse(req.query)
      let items = await prisma.item.findMany({ where: query })
      do {
        let item = items[0]
        if (app.specificItems.find(name => name === item.name)) return { item }
        items.splice(0, 1)
      } while (items.length)
      throw new Error('Item not found')
    })
  })

  router.rpc(BagService, BagService.methods.readItems, async req => {
    return await execute(req, async (req, app) => {
      const query = JSON.parse(req.query)
      let items = await prisma.item.findMany({ where: query })
      if (
        mappedPermissionValues[app.permissions] <
        mappedPermissionValues.WRITE_SPECIFIC
      )
        items = items.filter(
          item => app.specificItems.includes(item.name) || item.public
        )
      if (app.permissions === PermissionLevels.READ)
        items = items.filter(item => item.public)
      return { items }
    })
  })

  router.rpc(BagService, BagService.methods.updateItem, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificItems.find(item => item === req.itemId)
        )
          throw new Error('Invalid permissions')

        return {
          item: await prisma.item.update({
            where: { name: req.itemId },
            data: req.new
          })
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })
}
