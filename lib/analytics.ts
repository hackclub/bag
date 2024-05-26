const indev = process.env.NODE_ENV === 'development';

import config from '../config'
import { Client } from '@elastic/elasticsearch'
import dayjs from 'dayjs'

const elasticClient = () =>
  new Client({
    node: config.ELASTIC_NODE,
    auth: { apiKey: config.ELASTIC_API_TOKEN }
  })

declare global {
  var elastic: undefined | ReturnType<typeof elasticClient>
}

export const elastic = indev ? undefined : (globalThis.elastic ?? elasticClient())

export const log = async (
  index: string,
  id: string,
  document: object,
  update = false
) => {
  if (indev) {
    console.log('Logging:', index, id, document, update);
    return;
  }
  try {
    if (!(await elastic.indices.exists({ index })))
      await elastic.indices.create({ index })
    if (update)
      return await elastic.update({
        index: `bag-${index}`,
        id,
        doc_as_upsert: true,
        doc: document
      })
    return await elastic.index({
      index: `bag-${index}`,
      id,
      document: {
        ...document,
        date: dayjs(Date.now()).format('MM-DD-YYYY'),
        timestamp: dayjs(Date.now()).format('MM-DD-YYYY HH:mm:ss')
      }
    })
  } catch (error) {
    console.log('Analytics error:', error.toString())
  }
}