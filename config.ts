import 'dotenv/config'

export interface Env {
  PORT: number
  NODE_ENV: string
  SLACK_BOT_TOKEN: string
  SLACK_APP_TOKEN: string
  SLACK_SIGNING_SECRET: string
  DATABASE_URL: string
  APP_ID: number
  APP_TOKEN: string
}

let env: Env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
  SLACK_APP_TOKEN: process.env.SLACK_APP_TOKEN,
  SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  APP_ID: Number(process.env.APP_ID),
  APP_TOKEN: process.env.APP_TOKEN
}

if (Object.values(env).find(val => val === undefined))
  throw new Error('.env missing values')

export default env
