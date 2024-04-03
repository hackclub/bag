import config from '../../config'
import { Redis } from 'ioredis'

const redisClient = () => {
  const redis = new Redis(Number(config.PORT), config.REDIS_HOST, {
    maxRetriesPerRequest: 3
  })

  return {
    getFirstInSortedSet: async sortedSetKey => {
      const results = await redis.zrange(
        sortedSetKey,
        0,
        new Date().getTime(),
        'BYSCORE',
        'LIMIT',
        0,
        1
      )

      return results?.length ? results[0] : null
    },
    addToSortedSet: (sortedSetKey, member, score) =>
      redis.zadd(sortedSetKey, score, member),
    removeFromSortedSet: (sortedSetKey, member) =>
      redis.zrem(sortedSetKey, member),
    increaseCounter: counterKey => redis.incr(counterKey),
    setString: (stringKey, value) => redis.set(stringKey, value, 'GET'),
    getString: stringKey => redis.get(stringKey),
    removeString: stringKey => redis.del(stringKey),
    isConnected: async () => {
      try {
        await redis.get('dummy')
        return true
      } catch (e) {
        return false
      }
    }
  }
}

declare global {
  var redis: undefined | ReturnType<typeof redisClient>
}

export const redis = globalThis.redis ?? redisClient()

export const Scheduler = (pollingIntervalInSec: number, taskHandler) => {
  let isRunning = false

  return {
    schedule: async (data, timestamp) => {
      const taskId = await redis.increaseCounter('taskCounter')
      console.log(
        `Scheduled new task with ID ${taskId} and timestamp ${timestamp}`
      )
      await redis.setString(`task:${taskId}`, JSON.stringify(data))
      await redis.addToSortedSet('sortedTasks', taskId, timestamp)
    },
    start: async () => {
      console.log('Started scheduler')
      isRunning = true
    }
  }
}
