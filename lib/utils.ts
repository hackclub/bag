import fs from 'fs'
import path from 'path'
import { parse } from 'yaml'
import { Instance, Item, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const maintainersYaml = fs.readFileSync(
  path.join(process.cwd(), './maintainers.yaml'),
  'utf-8'
)
export const maintainers = parse(maintainersYaml)

export const channels = {
  approvals: 'C06EB2Y3YAE'
}

export const getKeyByValue = (obj, value) =>
  Object.keys(obj).find(key => obj[key] === value)

export const combineInventory = async (
  inventory: Instance[]
): Promise<[number, Instance[], Item][]> => {
  // Apply `reduce` to inventory to get rid of items that aren't unique but may have unique metadata, etc.
  let result: [number, Instance[], Item][] = []
  const reduced = inventory.reduce((acc: any, curr: Instance) => {
    const instance = acc.find(instances => instances[0].itemId == curr.itemId)
    if (instance) instance.push(curr)
    else acc.push([curr])
    return acc
  }, [])
  for (let instances of reduced) {
    const quantity = instances.reduce((acc: any, curr: Instance) => {
      return acc + curr.quantity
    }, 0)
    const ref = await prisma.item.findUnique({
      where: {
        name: instances[0].itemId
      }
    })
    result.push([quantity, instances, ref])
  }
  return result
}
