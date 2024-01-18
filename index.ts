import config from './config'
import { PrismaClient } from '@prisma/client'
import slack from './lib/slack/slack'
import './lib/slack/routes/app'
import './lib/slack/routes/inventory'
import './lib/slack/routes/item'
import './lib/slack/routes/perms'
import './lib/slack/routes/trade'

const prisma = new PrismaClient()

// @prettier-ignore
;(async () => {
  // Shutdown signal - shutdown Prisma client
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
  })

  process.on('SIGQUIT', async () => {
    await prisma.$disconnect()
  })

  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
  })

  await slack.start(config.PORT)
  console.log(`⚡️ Bolt app is running on port ${config.PORT}!`)
})()
