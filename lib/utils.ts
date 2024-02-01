import fs from 'fs'
import path from 'path'
import { parse } from 'yaml'

const maintainersYaml = fs.readFileSync(
  path.join(process.cwd(), './maintainers.yaml'),
  'utf-8'
)
export const maintainers = parse(maintainersYaml)

const channelsYaml = fs.readFileSync(
  path.join(process.cwd(), './blacklist.yaml'),
  'utf-8'
)
export const channelBlacklist = parse(channelsYaml)

export const channels = {
  approvals: 'C06EB2Y3YAE'
}

export const getKeyByValue = (obj, value) =>
  Object.keys(obj).find(key => obj[key] === value)

export const userRegex = /^<@[\d\w]+\|[\s\S]+>$/gm

export const httpsLocal = () => {
  return {
    key: fs.readFileSync(path.join(process.cwd(), 'priv.pem')).toString(),
    cert: fs.readFileSync(path.join(process.cwd(), 'cert.pem')).toString()
  }
}
