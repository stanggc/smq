import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { httpHandler } from './handler.ts'
import { MQ } from './mq.ts'
import { HTTPRequest, HTTPResponse } from './types.ts'
import { readConfigFile, toSingleValuedRecord } from './util.ts'
import defaultConfig from './default-config.json' with { type: 'json' }

async function main() {
  let config: Record<string, any>
  try {
    config = await readConfigFile('./config.json')
  } catch (e) {
    console.error(`Unable to read configuration file: ${e.message}`)
    console.error('Using default configuration.')
    config = defaultConfig
  }

  // If fields are not present, use the default ones.
  config = {
    ...defaultConfig,
    ...config,
  }

  const mq = new MQ(config.MessageMaxSize, config.Capacity, config.AuthKey)
  const http = createServer((req, resp) => {
    const httpReq: HTTPRequest = {
      method: req.method!,
      url: req.url!,
      headers: toSingleValuedRecord(req.headers),
      readableStream() {
        return Readable.toWeb(req) as ReadableStream<Uint8Array>
      },
    }
    const httpResp: HTTPResponse = {
      write(statusCode, headers, data?) {
        resp.writeHead(statusCode, headers).end(data)
      },
    }
    httpHandler(mq, httpReq, httpResp)
  })
  console.log(`Message max size: ${config.MessageMaxSize}`)
  console.log(`Capacity: ${config.Capacity}`)
  console.log(`Listening on port ${config.Port}.`)
  http.listen(config.Port)
}

main()
