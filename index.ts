import config from './config'
import express from 'express'
import { App } from '@slack/bolt'
import prisma from './db/client'

const app = express()

const slack = new App({
  token: config.SLACK_BOT_TOKEN,
  appToken: config.SLACK_APP_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET,
  socketMode: config.NODE_ENV === 'development' ? true : false
})

const execute = async (props, func) => {
  const { ack, logger } = props

  await ack()
  try {
    await func(props)
  } catch (error) {
    logger.error(error)
  }
}

slack.command('/about', async props => {
  await execute(props, async ({ respond }) => {
    await respond('hi')
  })
})

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
