import config from './config'
import prisma from './lib/db'
import slack from './lib/slack/routes'

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
