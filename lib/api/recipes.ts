import { BagService } from '../../gen/bag_connect'
import { prisma } from '../db'
import { mappedPermissionValues } from '../permissions'
import { execute } from './routing'
import { ConnectRouter } from '@connectrpc/connect'
import { PermissionLevels, RecipeItem, Skill } from '@prisma/client'
import { PrismaClientExtends } from '@prisma/client/extension'

export default (router: ConnectRouter) => {
  router.rpc(BagService, BagService.methods.createRecipe, async req => {
    return await execute(
      'create-recipe',
      req,
      async (req, app) => {
        const sum = (inputs: RecipeItem[], tools: RecipeItem[]): number => {
          const inputTotal = inputs.reduce(
            (curr, acc) => curr + acc.quantity,
            0
          )
          const toolTotal = tools.reduce((curr, acc) => curr + acc.quantity, 0)
          return inputTotal + toolTotal
        }

        const { recipe } = req
        if (sum(recipe.inputs, recipe.tools) < 2 || !recipe.outputs.length)
          throw new Error(
            'Recipe requires at least two inputs and/or at least one output'
          )

        // Create recipe
        const newRecipe = await prisma.recipe.create({
          data: {
            description: recipe.description || 'No description provided.',
            time: recipe.time || 60000
          }
        })
        // Add to permission list depending on app permissions
        if (app.permissions === PermissionLevels.WRITE_SPECIFIC)
          await prisma.app.update({
            where: { id: app.id },
            data: { specificRecipes: { push: newRecipe.id } }
          })

        for (let input of recipe.inputs) {
          let create = await prisma.recipeItem.findFirst({ where: input })
          if (!create)
            await prisma.recipeItem.create({
              data: {
                ...input,
                inputs: { connect: { id: newRecipe.id } }
              }
            })
          else
            await prisma.recipeItem.update({
              where: { id: create.id },
              data: { inputs: { connect: { id: newRecipe.id } } }
            })
        }
        for (let output of recipe.outputs) {
          let create = await prisma.recipeItem.findFirst({ where: output })
          if (!create)
            await prisma.recipeItem.create({
              data: {
                ...output,
                outputs: { connect: { id: newRecipe.id } }
              }
            })
          else
            await prisma.recipeItem.update({
              where: { id: create.id },
              data: { outputs: { connect: { id: newRecipe.id } } }
            })
        }
        for (let tool of recipe.tools) {
          let create = await prisma.recipeItem.findFirst({ where: tool })
          if (!create)
            await prisma.recipeItem.create({
              data: {
                ...tool,
                tools: { connect: { id: newRecipe.id } }
              }
            })
          else
            await prisma.recipeItem.update({
              where: { id: create.id },
              data: { tools: { connect: { id: newRecipe.id } } }
            })
        }
        for (let skill of recipe.skills) {
          let create = await prisma.skill.findFirst({ where: skill })
          if (!create)
            await prisma.skill.create({
              data: {
                ...skill,
                skills: { connect: { id: newRecipe.id } }
              }
            })
          else
            await prisma.skill.update({
              where: { name: create.name },
              data: { recipe: { connect: { id: newRecipe.id } } }
            })
        }

        return {
          recipe: await prisma.recipe.findUnique({
            where: { id: newRecipe.id },
            include: {
              inputs: true,
              outputs: true,
              tools: true,
              skills: true
            }
          })
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })

  router.rpc(BagService, BagService.methods.getRecipe, async req => {
    return await execute('get-recipe', req, async (req, app) => {
      let recipes = await prisma.recipe.findMany({
        include: {
          inputs: true,
          outputs: {
            include: { recipeItem: true }
          },
          tools: true,
          skills: true
        }
      })

      const query = req.query

      // Search through recipes
      if (query) {
        recipes = recipes.filter(recipe => {
          let copy = structuredClone(query)
          let incomplete = false
          for (let item of recipe.inputs) {
            const search = copy.inputs.findIndex(
              input => input.recipeItemId === item.recipeItemId
            )
            if (search < 0) incomplete = true
            copy.inputs.splice(search, 1)
          }
          for (let item of recipe.outputs) {
            const search = copy.outputs.findIndex(
              output => output.recipeItemId === item.recipeItemId
            )
            if (search < 0) incomplete = true
            copy.outputs.splice(search, 1)
          }
          for (let item of recipe.tools) {
            const search = copy.tools.findIndex(
              tool => tool.recipeItemId === item.recipeItemId
            )
            if (search < 0) incomplete = true
            copy.tools.splice(search, 1)
          }
          for (let recipeSkill of recipe.skills) {
            const search = copy.skills.findIndex(
              skill => skill.name === recipeSkill.name
            )
            if (search < 0) incomplete = true
            copy.skills.splice(search, 1)
          }
          if (
            copy.inputs.length ||
            copy.outputs.length ||
            copy.tools.length ||
            copy.skills.length ||
            incomplete
          )
            return false
          return true
        })
      }

      if (app.permissions === PermissionLevels.READ)
        recipes = recipes.filter(recipe => recipe.public)
      else if (
        mappedPermissionValues[app.permissions] < mappedPermissionValues.WRITE
      )
        recipes = recipes.filter(
          recipe =>
            app.specificRecipes.find(id => recipe.id === id) || recipe.public
        )
      return { recipe: recipes[0] }
    })
  })

  router.rpc(BagService, BagService.methods.getRecipes, async req => {
    return await execute('get-recipes', req, async (req, app) => {
      let recipes = await prisma.recipe.findMany({
        include: {
          inputs: true,
          outputs: {
            include: { recipeItem: true }
          },
          tools: true,
          skills: true
        }
      })

      const query = req.query

      // Search through recipes
      if (req.inclusive) {
        // Search for recipes that include at least one of the inputs/outputs/tools/skills
        recipes = recipes.filter(recipe => {
          for (let item of recipe.inputs) {
            if (
              query.inputs.find(
                input => input.recipeItemId === item.recipeItemId
              )
            )
              return true
          }
          for (let item of recipe.outputs) {
            if (
              query.outputs.find(
                output => output.recipeItemId === item.recipeItemId
              )
            )
              return true
          }
          for (let item of recipe.tools) {
            if (
              query.tools.find(tool => tool.recipeItemId === item.recipeItemId)
            )
              return true
          }
          for (let recipeSkill of recipe.skills) {
            if (query.skills.find(skill => skill.name === recipeSkill.name))
              return true
          }
          return false
        })
      } else if (query) {
        recipes = recipes.filter(recipe => {
          let copy = structuredClone(query)
          let incomplete = false
          for (let item of recipe.inputs) {
            const search = copy.inputs.findIndex(
              input => input.recipeItemId === item.recipeItemId
            )
            if (search < 0) incomplete = true
            copy.inputs.splice(search, 1)
          }
          for (let item of recipe.outputs) {
            const search = copy.outputs.findIndex(
              output => output.recipeItemId === item.recipeItemId
            )
            if (search < 0) incomplete = true
            copy.outputs.splice(search, 1)
          }
          for (let item of recipe.tools) {
            const search = copy.tools.findIndex(
              tool => tool.recipeItemId === item.recipeItemId
            )
            if (search < 0) incomplete = true
            copy.tools.splice(search, 1)
          }
          for (let recipeSkill of recipe.skills) {
            const search = copy.skills.findIndex(
              skill => skill.name === recipeSkill.name
            )
            if (search < 0) incomplete = true
            copy.skills.splice(search, 1)
          }
          if (
            copy.inputs.length ||
            copy.outputs.length ||
            copy.tools.length ||
            copy.skills.length ||
            incomplete
          )
            return false
          return true
        })
      }

      if (app.permissions === PermissionLevels.READ)
        recipes = recipes.filter(recipe => recipe.public)
      else if (
        mappedPermissionValues[app.permissions] < mappedPermissionValues.WRITE
      )
        recipes = recipes.filter(
          recipe =>
            app.specificRecipes.find(id => recipe.id === id) || recipe.public
        )
      return { recipes }
    })
  })

  router.rpc(BagService, BagService.methods.updateRecipe, async req => {
    return await execute(
      'update-recipe',
      req,
      async (req, app) => {
        if (
          app.permissions === PermissionLevels.WRITE_SPECIFIC &&
          !app.specificRecipes.find(recipeId => recipeId === req.recipeId)
        )
          throw new Error('Recipe not found')

        const sum = (inputs: RecipeItem[], tools: RecipeItem[]): number => {
          const inputTotal = inputs.reduce(
            (curr, acc) => curr + acc.quantity,
            0
          )
          const toolTotal = tools.reduce((curr, acc) => curr + acc.quantity, 0)
          return inputTotal + toolTotal
        }

        const { new: recipe } = req
        if (sum(recipe.inputs, recipe.tools) < 2 || !recipe.outputs.length)
          throw new Error(
            'Recipe requires at least two inputs and/or at least one output'
          )
        console.log(`Attempting to update recipe id ${req.recipeId} (time: ${recipe.time})`);
        // Update recipe
        const update = await prisma.recipe.update({
          where: { id: req.recipeId },
          data: { description: recipe.description, time: recipe.time },
          include: {
            inputs: true,
            outputs: true,
            tools: true,
            skills: true
          }
        })

        for (let input of recipe.inputs) {
          // Check if there's an existing RecipeItem, and use that if possible
          if (
            !update.inputs.find(
              item => item.recipeItemId === input.recipeItemId
            )
          ) {
            let create = await prisma.recipeItem.findFirst({ where: input })
            if (create)
              await prisma.recipeItem.update({
                where: { id: create.id },
                data: { inputs: { connect: { id: update.id } } }
              })
            else
              await prisma.recipeItem.create({
                data: {
                  ...input,
                  inputs: { connect: { id: update.id } }
                }
              })
          }
        }
        for (let output of recipe.outputs) {
          if (
            !update.outputs.find(
              item => item.recipeItemId === output.recipeItemId
            )
          ) {
            let create = await prisma.recipeItem.findFirst({ where: output })
            if (create)
              await prisma.recipeItem.update({
                where: { id: create.id },
                data: { outputs: { connect: { id: update.id } } }
              })
            else
              await prisma.recipeItem.create({
                data: {
                  ...output,
                  outputs: { connect: { id: update.id } }
                }
              })
          }
        }
        for (let tool of recipe.tools) {
          if (
            !update.tools.find(item => item.recipeItemId === tool.recipeItemId)
          ) {
            let create = await prisma.recipeItem.findFirst({ where: tool })
            if (create)
              await prisma.recipeItem.update({
                where: { id: create.id },
                data: { tools: { connect: { id: update.id } } }
              })
            else
              await prisma.recipeItem.create({
                data: {
                  ...tool,
                  tools: { connect: { id: update.id } }
                }
              })
          }
        }
        for (let skill of recipe.skills) {
          if (
            !update.skills.find(
              skillInstance => skillInstance.name === skill.name
            )
          ) {
            let create = await prisma.skill.findFirst({ where: skill })
            if (create)
              await prisma.skill.update({
                where: { name: create.name },
                data: { recipe: { connect: { id: update.id } } }
              })
            else
              await prisma.skill.create({
                data: {
                  ...skill,
                  recipe: { connect: { id: update.id } }
                }
              })
          }
        }

        return {
          recipe: await prisma.recipe.findUnique({
            where: { id: req.recipeId },
            include: {
              inputs: true,
              outputs: true,
              tools: true,
              skills: true
            }
          })
        }
      },
      mappedPermissionValues.WRITE_SPECIFIC
    )
  })
}
