import { BagService } from '../../gen/bag_connect'
import { prisma } from '../db'
import { log } from '../logger'
import { mappedPermissionValues } from '../permissions'
import { execute } from './routing'
import { type ConnectRouter } from '@connectrpc/connect'
import { PermissionLevels } from '@prisma/client'

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.createItem, async req => {
    return await execute(
      'create-item',
      req,
      async req => {
        if (!req.item.name || !req.item.reaction)
          throw new Error('Required fields for new items: name, reaction')
        const item = await prisma.item.create({ data: req.item })
        log('New item created: ', item.name)
        return { item }
      },
      mappedPermissionValues.ADMIN
    )
  })

  router.rpc(BagService, BagService.methods.getItem, async req => {
    return await execute('get-item', req, async (req, app) => {
      const query = JSON.parse(req.query)
      let items = await prisma.item.findMany({ where: query })
      if (!items.length) throw new Error('Item not found')
      return { item: items[0] }
    })
  })

  router.rpc(BagService, BagService.methods.getItems, async req => {
    return await execute('get-items', req, async (req, app) => {
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
      'update-item',
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificItems.find(item => item === req.itemId)
        )
          throw new Error('Invalid permissions')

        const item = await prisma.item.update({
          where: { name: req.itemId },
          data: req.new
        })

        // Update instances if item's public status has also changed
        await prisma.instance.updateMany({
          where: { itemId: item.name },
          data: { public: item.public }
        })

        return { item }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })
}
