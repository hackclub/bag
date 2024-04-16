import config from '../../config'
import { Redis } from 'ioredis'

const redisClient = () => {
  const redis = new Redis(config.REDIS_PORT, config.REDIS_HOST, {
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

export const ms = (h: number = 0, m: number = 0, s: number = 0) =>
  (h * 60 * 60 + m * 60 + s) * 1000

export const Scheduler = (
  id: string,
  pollingInterval: number,
  taskHandler,
  cleanupHandler?
) => {
  let isRunning = false

  return {
    schedule: async (data: object, timestamp: number) => {
      const taskId = await redis.increaseCounter('taskCounter')
      console.log(
        `Scheduled new task with ID ${taskId} and timestamp ${timestamp}`
      )
      await redis.setString(taskId, JSON.stringify(data))
      await redis.addToSortedSet(id, taskId, timestamp)
    },
    start: async () => {
      console.log('Started scheduler')
      isRunning = true

      const findNextTask = async () => {
        const isRedisConnected = await redis.isConnected()
        if (isRunning && isRedisConnected) {
          let taskId
          do {
            taskId = await redis.getFirstInSortedSet(id)

            let cleanup = false
            if (taskId) {
              console.log(`Found task ${taskId}`)
              const taskData = JSON.parse(await redis.getString(taskId))
              try {
                console.log(`Passing data for task ${taskId}`, taskData)
                cleanup = await taskHandler(taskData, taskId)
              } catch (err) {
                console.log(err)
              }
              await redis.removeString(taskId)
              await redis.removeFromSortedSet(id, taskId)
              if (cleanup && cleanupHandler) {
                try {
                  await cleanupHandler(taskData, taskId)
                } catch (err) {
                  console.log('cleanupHandler error: ', err)
                }
              }
            }
          } while (taskId)

          setTimeout(findNextTask, pollingInterval)
        }
      }

      findNextTask()
    },
    stop: () => {
      isRunning = false
      console.log('Stopped scheduler')
    }
  }
}
