import config from './config'
import { prisma } from './lib/db'
// @prettier-ignore
import './lib/slack/routes/app'
import './lib/slack/routes/craft'
import './lib/slack/routes/give'
import './lib/slack/routes/inventory'
import './lib/slack/routes/item'
import './lib/slack/routes/perms'
import './lib/slack/routes/trade'
import slack from './lib/slack/slack'

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

  await slack.start(config.SLACK_PORT)
  console.log(`⚡️ Bolt app is running on port ${config.SLACK_PORT}!`)
})()
