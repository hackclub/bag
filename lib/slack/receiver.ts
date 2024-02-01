import routes from '../../routes'
import { connectNodeAdapter } from '@connectrpc/connect-node'
import { HTTPReceiver, HTTPReceiverOptions } from '@slack/bolt'
import express from 'express'
import { IncomingMessage } from 'http'
import { createServer } from 'https'

export default class CustomReceiver extends HTTPReceiver {
  constructor(options: HTTPReceiverOptions) {
    super({
      ...options
    })
  }

  async addGrpc() {
    // Inject GRPC routes into the server
  }
}
