import { prisma } from '../../db'
import slack, { execute } from '../slack'
import { parse } from 'yaml'

slack.command('/use', async props => {
  await execute(props, async props => {
    // Get tools
    // Check if tools can be used in location
    // If so, create a Results tree from the results value
    // And run that tree
    // Cleanup and remove any inputs
  })
})

class Results {
  // Results is a recursive tree that
  constructor() {}
}

const sleep = async (seconds: number) => {}

const cacheUses = async () => {
  // Pull from GitHub and cache
}
