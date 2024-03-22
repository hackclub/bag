import { findOrCreateIdentity, prisma } from './db'
import fs from 'fs'
import path from 'path'
import { parse } from 'yaml'

const maintainersYaml = fs.readFileSync(
  path.join(process.cwd(), './maintainers.yaml'),
  'utf-8'
)
export const maintainers = parse(maintainersYaml)
export const inMaintainers = (id: string) =>
  Object.values(maintainers)
    .map((maintainer: any) => maintainer.slack)
    .includes(id)

const channelsYaml = fs.readFileSync(
  path.join(process.cwd(), './blacklist.yaml'),
  'utf-8'
)
export const channelBlacklist = parse(channelsYaml)

export const channels = {
  approvals: 'C06EB2Y3YAE',
  lounge: 'C0266FRGV'
}

export const getKeyByValue = (obj, value) =>
  Object.keys(obj).find(key => obj[key] === value)

export const userRegex = /^<@[\s\S]+\|[\s\S]+>$/gm
