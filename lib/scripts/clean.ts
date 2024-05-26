import { prisma } from '../db'
import { maintainers } from '../utils'

// TODO: Set up script to regularly clean database
async function cleanup() {
  await prisma.crafting.deleteMany({
    where: { identityId: maintainers.jc.slack }
  })
}

cleanup()

// async function main() {
//   const { inventory } = await prisma.identity.findFirst({
//     where: { slack: 'U062KS2PK7Z' },
//     include: { inventory: true }
//   })
//   console.log(inventory.length)
//   for (let instance of inventory) {
//     await prisma.instance.update({
//       where: { id: instance.id },
//       data: { identity: { disconnect: true } }
//     })
//   }
//   await prisma.trade.deleteMany({
//     where: {
//       OR: [
//         { initiatorIdentityId: 'U062KS2PK7Z' },
//         { receiverIdentityId: 'U062KS2PK7Z' }
//       ]
//     }
//   })
//   await prisma.identity.delete({
//     where: {
//       slack: 'U062KS2PK7Z'
//     }
//   })
// }
