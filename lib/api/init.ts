import express from 'express'
import { expressConnectMiddleware } from '@connectrpc/connect-express'
import routes from '../../routes'
import appRoutes from './app'
import config from '../../config'

export const app = express()

// Add middleware
app.use(expressConnectMiddleware({ routes }))

app.get('/', async (_, res) => {
  res.send(`⚡️ Bolt app is running on port ${config.PORT}!`)
})

app.use('/app', appRoutes)
