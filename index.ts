import config from './config'
import express from 'express'
import { App, SlackCommandMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt'
import { StringIndexed } from '@slack/bolt/dist/types/helpers'
import prisma from './db/client'

const app = express()

app.get('/', async (_, res) => {
  res.send('Hello, world!')
})

const slack = new App({
  token: config.SLACK_BOT_TOKEN,
  appToken: config.SLACK_APP_TOKEN,
  signingSecret: config.SLACK_SIGNING_SECRET,
  socketMode: config.NODE_ENV === 'development' ? true : false
})

const execute = async (props, func) => {
  // Execute wrapper around
  const { ack, logger } = props

  await ack()
  try {
    await func(props)
  } catch (error) {
    logger.error(error)
  }
}

slack.command('/about', async props => {
  await execute(
    props,
    async ({
      logger
    }: SlackCommandMiddlewareArgs & AllMiddlewareArgs<StringIndexed>) => {}
  )
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
