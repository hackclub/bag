import config from './config'
import express from 'express'
import prisma from './db/client'
import slack from './lib/slack/routes'

const app = express()

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
  console.log('⚡️ Bolt app is running!')
})()
