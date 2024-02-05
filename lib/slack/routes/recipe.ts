import { prisma } from '../../db'
import { channelBlacklist, channels } from '../../utils'
import slack, { execute } from '../slack'
import views from '../views'
import type { Block, KnownBlock, View } from '@slack/bolt'

slack.command('/huh', async props => {
  return await execute(props, async props => {})
})
