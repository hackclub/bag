import { BagService } from '../../gen/bag_connect'
import { findOrCreateIdentity, prisma, InstanceWithItem } from '../db'
import { mappedPermissionValues } from '../permissions'
import { execute, web } from './routing'
import { ConnectRouter } from '@connectrpc/connect'
import { PermissionLevels } from '@prisma/client'
import { Block, KnownBlock } from '@slack/bolt'

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.createInstances, async req => {
    return await execute(
      req,
      async (req, app) => {
        let created = []
        let formatted = []

        let identity = await findOrCreateIdentity(req.identityId)

        for (let instance of req.instances) {
          if (
            app.permissions === PermissionLevels.WRITE_SPECIFIC &&
            !app.specificItems.find(item => item === req.itemId)
          )
            throw new Error('Not enough permissions to create instance')

          const item = await prisma.item.findUnique({
            where: { name: instance.itemId }
          })

          // Create instance
          let create
          const existing = identity.inventory.find(
            instance => instance.itemId === item.name
          )
          if (existing !== undefined) {
            create = await prisma.instance.update({
              where: { id: existing.id },
              data: {
                quantity:
                  existing.quantity + Math.max(instance.quantity || 0, 1),
                metadata: instance.metadata
                  ? {
                      ...(existing.metadata as object),
                      ...JSON.parse(req.metadata)
                    }
                  : existing.metadata
              },
              include: { item: true }
            })
          } else
            create = await prisma.instance.create({
              data: {
                itemId: item.name,
                identityId: req.identityId,
                quantity: instance.quantity || 1,
                metadata: instance.metadata ? JSON.parse(instance.metadata) : {}
              },
              include: { item: true }
            })
          created.push(create)
          formatted.push(
            `x${instance.quantity || 1} ${item.reaction} *${item.name}*`
          )
        }

        // Send message to instance receiver
        let text = []
        if (req.show !== false)
          text.push({
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${app.name}* just sent you ${
                formatted.slice(0, formatted.length - 1).join(', ') +
                (formatted.length > 2 ? ',' : '') +
                (formatted.length > 1 ? ' and ' : '') +
                formatted[formatted.length - 1]
              }! They're all in your bag now.`
            }
          })
        if (req.note)
          text.push(
            { type: 'divider' },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${req.note}`
              }
            },
            { type: 'divider' }
          )
        if (text.length)
          await web.chat.postMessage({
            channel: req.identityId,
            blocks: text
          })

        return { instances: created }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.createInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificItems.find(item => item === req.itemId)
        )
          throw new Error('Not enough permissions to create instance')

        // Create instance
        let identity = await findOrCreateIdentity(req.identityId)
        let instance
        const existing = identity.inventory.find(
          instance => instance.itemId === req.itemId
        )
        if (existing !== undefined)
          instance = await prisma.instance.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + Math.max(req.quantity || 0, 1),
              metadata: req.metadata
                ? {
                    ...(existing.metadata as object),
                    ...JSON.parse(req.metadata)
                  }
                : existing.metadata
            },
            include: { item: true }
          })
        else
          instance = await prisma.instance.create({
            data: {
              itemId: req.itemId,
              identityId: req.identityId,
              quantity: req.quantity || 1,
              metadata: req.metadata ? JSON.parse(req.metadata) : {}
            },
            include: { item: true }
          })

        // Send message to instance receiver
        let text: (Block | KnownBlock)[] = []
        if (req.show !== false)
          text.push({
            type: 'section',
            text: {
              text: `*${app.name}* just sent you x${req.quantity || 1} ${
                instance.item.reaction
              } *${instance.item.name}*! It's in your bag now.`,
              type: 'mrkdwn'
            }
          })
        if (req.note)
          text.push(
            { type: 'divider' },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${req.note}`
              }
            },
            { type: 'divider' }
          )
        if (text.length)
          await web.chat.postMessage({
            channel: req.identityId,
            blocks: text
          })

        return { instance }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.getInstance, async req => {
    return await execute(req, async (req, app) => {
      const instance = await prisma.instance.findUnique({
        where: { id: req.instanceId }
      })

      if (!instance.public && app.permissions === PermissionLevels.READ)
        throw new Error('Instance not found')
      else if (
        mappedPermissionValues[app.permissions] <
          mappedPermissionValues.WRITE &&
        !app.specificItems.find(itemId => itemId === instance.itemId)
      )
        return { instance }
      throw new Error('Instance not found')
    })
  })

  router.rpc(BagService, BagService.methods.updateInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificApps.find(item => item === req.itemId)
        )
          throw new Error('Invalid permissions')

        if (req.new.id !== undefined) delete req.new.id
        let instance = await prisma.instance.update({
          where: { id: req.instanceId },
          data: req.new
        })

        let text: (Block | KnownBlock)[] = []
        if (instance.quantity === 0) {
          // Delete instance
          instance = await prisma.instance.update({
            where: { id: req.instanceId },
            data: { identity: { disconnect: true } },
            include: { item: true }
          })

          if (req.show !== false)
            text.push({
              type: 'section',
              text: {
                text: `*${app.name}* just removed ${
                  (instance as InstanceWithItem).item.name
                } from your bag!`,
                type: 'mrkdwn'
              }
            })
        } else if (req.show !== false)
          text.push({
            type: 'section',
            text: {
              text: `*${app.name}* just updated ${
                (instance as InstanceWithItem).item.name
              } from your bag!`,
              type: 'mrkdwn'
            }
          })
        if (req.note)
          text.push(
            { type: 'divider' },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `${req.note}`
              }
            },
            { type: 'divider' }
          )
        if (text.length)
          await web.chat.postMessage({
            channel: req.identityId,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: text.join('')
                }
              }
            ]
          })

        return { instance }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.deleteInstance, async req => {
    return await execute(
      req,
      async (req, app) => {
        const instance = await prisma.instance.findUnique({
          where: {
            id: req.instanceId
          }
        })
        if (!instance) throw new Error('Instance not found')
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificItems.find(item => item === instance.itemId)
        )
          throw new Error('Invalid permissions')

        return {
          deletedInstance: await prisma.instance.update({
            where: { id: req.instanceId },
            data: {
              identity: { disconnect: true }
            }
          })
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })
}
