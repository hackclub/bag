// Extra routes intended to replace humans
import { BagService } from '../../gen/bag_connect'
import { craft, findOrCreateIdentity, prisma } from '../db'
import { execute } from './routing'
import { type ConnectRouter } from '@connectrpc/connect'
import { PermissionLevels, type Instance } from '@prisma/client'

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.runGive, async req => {
    return await execute('run-give', req, async req => {
      // Make sure all instances belong to giver
      const receiver = await findOrCreateIdentity(req.receiverId)
      let instances = []
      let given = []

      for (let [i, instance] of req.instances.entries()) {
        const ref = await prisma.instance.findUnique({
          where: { id: instance.id }
        })
        if (ref.identityId !== req.giverId)
          throw new Error(
            `Instance ${instance.id} doesn't belong to ${req.identityId}`
          )
        else if (ref.quantity < instance.quantity)
          throw new Error(`Not enough ${ref.itemId} to give away`)
        instances.push([instance, i])
      }

      // Transfer items over
      for (let [instance, i] of instances) {
        const give = req.instances[i]
        if (give.quantity < instance.quantity) {
          await prisma.instance.update({
            where: { id: instance.id },
            data: { quantity: instance.quantity - give.quantity }
          })
          const receiverInstance = receiver.inventory.find(
            receiverInstance => receiverInstance.itemId === instance.itemId
          )
          if (receiverInstance)
            given.push(
              await prisma.instance.update({
                where: { id: receiverInstance.id },
                data: {
                  quantity: receiverInstance.quantity + give.quantity
                }
              })
            )
          else
            given.push(
              await prisma.instance.create({
                data: {
                  itemId: instance.itemId,
                  identityId: receiver.slack,
                  quantity: give.quantity,
                  public: instance.public
                }
              })
            )
        }
        // Transfer entire instance over
        else
          given.push(
            await prisma.instance.update({
              where: { id: instance.id },
              data: { identityId: receiver.slack }
            })
          )
      }

      return { instances: given }
    })
  })

  router.rpc(BagService, BagService.methods.runCraft, async req => {
    return await execute('run-craft', req, async (req, app) => {
      const recipe = await prisma.recipe.findUnique({
        where: req.recipeId,
        include: {
          inputs: true,
          tools: true,
          outputs: true
        }
      })

      if (
        !recipe ||
        (!recipe.public && app.permissions === PermissionLevels.READ)
      )
        throw new Error('Recipe not found')

      // Make sure identity has all the recipe items
      const identity = await findOrCreateIdentity(req.identityId)
      const ingredients = [...recipe.inputs, ...recipe.outputs]
      let instances: Instance[] = []
      for (let ingredient of ingredients) {
        const search = identity.inventory.find(
          instance => instance.itemId === ingredient.recipeItemId
        )
        if (!search)
          throw new Error(
            `${identity.slack} doesn't have ${ingredient.recipeItemId} to craft`
          )
        else if (search.quantity < ingredient.quantity)
          throw new Error(
            `${identity.slack} does not have enough ${ingredient.recipeItemId} to craft`
          )
        instances.push({
          ...search,
          quantity: ingredient.quantity
        })
      }

      // Create crafting
      const crafting = await prisma.crafting.create({
        data: { identityId: identity.slack }
      })

      for (let instance of instances) {
        await prisma.recipeItem.create({
          data: {
            recipeItemId: instance.itemId,
            instanceId: instance.id,
            quantity: instance.quantity,
            craftingInputs: { connect: { id: crafting.id } }
          }
        })
      }

      await craft(identity.slack, crafting.id, req.recipeId)
    })
  })
}
