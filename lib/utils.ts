import fs from 'fs'
import path from 'path'
import { parse } from 'yaml'

const maintainersYaml = fs.readFileSync(
  path.join(process.cwd(), './maintainers.yaml'),
  'utf-8'
)
export const maintainers = parse(maintainersYaml)
