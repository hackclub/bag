import express from 'express'
import { expressConnectMiddleware } from '@connectrpc/connect-express'
import routes from '../../routes'
import appRoutes from './app'

export const app = express()

// Add middleware
app.use(expressConnectMiddleware({ routes }))

app.get('/', async (_, res) => {
  res.send('Hello, world!')
})

app.use('/app', appRoutes)
