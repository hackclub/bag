import 'dotenv/config'

export interface Env {
  PORT: number
  SLACK_PORT: number
  NODE_ENV: string
  SLACK_BOT_TOKEN: string
  SLACK_APP_TOKEN: string
  SLACK_SIGNING_SECRET: string
  SLACK_BOT: boolean
  SLACK_RATE_LIMIT: number
  DATABASE_URL: string
  APP_ID: number
  APP_KEY: string
  ELASTIC_NODE: string
  ELASTIC_API_TOKEN: string
}

let env: Env = {
  PORT: Number(process.env.PORT) || 3000,
  SLACK_PORT: Number(process.env.SLACK_PORT) || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
  SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN,
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
  SLACK_RATE_LIMIT: Number(process.env.SLACK_RATE_LIMIT) || 25,
  DATABASE_URL: process.env.DATABASE_URL,
  APP_ID: Number(process.env.APP_ID),
  APP_KEY: process.env.APP_KEY,
  SLACK_BOT: process.env.SLACK_BOT ? true : false,
  ELASTIC_NODE: process.env.ELASTIC_NODE,
  ELASTIC_API_TOKEN: process.env.ELASTIC_API_TOKEN
}

if (Object.values(env).find(val => val === undefined))
  throw new Error('.env missing values')

export default env
