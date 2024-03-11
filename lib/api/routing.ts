// Utils for router requests
import config from '../../config'
import { prisma } from '../db'
import { mappedPermissionValues } from '../permissions'
import { App } from '@prisma/client'
import { WebClient } from '@slack/web-api'

export const web = new WebClient(config.SLACK_BOT_TOKEN)

const format = obj => {
  if (obj.metadata) obj.metadata = JSON.stringify(obj.metadata)
  for (let [key, value] of Object.entries(obj)) {
    if (value instanceof Object) obj[key] = format(value)
    else if (value === null) obj[key] = undefined
  }
  return obj
}

export async function execute(
  req: any,
  func: (req: any, app: App) => any,
  permission?: number
) {
  try {
    let app = await prisma.app.findUnique({
      where: { id: req.appId, AND: [{ key: req.key }] }
    })
    if (!app) throw new Error('App not found or invalid app key')
    if (mappedPermissionValues[app.permissions] < permission)
      throw new Error(
        'Invalid permissions. Request permissions in Slack with /app.'
      )
    // Strip appId and key
    delete req.appId
    delete req.key
    const result = await func(req, app)
    let formatted = {}
    for (let [key, value] of Object.entries(result))
      formatted[key] = format(value)
    return formatted
  } catch (error) {
    console.log(error)
    return { response: error.toString() }
  }
}
