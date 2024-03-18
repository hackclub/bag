import { prisma } from '../db'

async function getUniqueUsers() {
  let unique = []

  const users = await prisma.identity.findMany()
  for (let user of users) {
    console.log(user)

    // Have they ever used craft?
    const craft = await prisma.crafting.findFirst({
      where: { identityId: user.slack }
    })
    if (craft) {
      unique.push({ id: user.slack, tried: 'crafting' })
      continue
    }

    // Have they ever used an action?
    const action = await prisma.actionInstance.findFirst({
      where: { identityId: user.slack }
    })
    if (action) {
      unique.push({ id: user.slack, tried: 'action' })
      continue
    }

    const trade = await prisma.trade.findFirst({
      where: {
        OR: [
          { initiatorIdentityId: user.slack },
          { receiverIdentityId: user.slack }
        ],
        closed: true
      }
    })
    if (trade) {
      unique.push({ id: user.slack, tried: 'trade' })
      continue
    }
  }

  return unique
}

;(async () => {
  const unique = await getUniqueUsers()
  console.log(unique.length)
})()
