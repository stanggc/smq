import { toArrayBuffer } from '@std/streams'
import { MQ } from './mq.ts'
import {
  Action,
  HTTPRequest,
  HTTPResponse,
  MQMessageWithStatusCode,
} from './types.ts'
import {
  respondNotFound,
  textMessage,
  writeResponse,
  writeTextResponse,
} from './util.ts'

export async function httpHandler(
  mq: MQ,
  req: HTTPRequest,
  resp: HTTPResponse,
) {
  if (req.url !== '/msg') {
    respondNotFound(resp)
    return
  }

  let action = ''
  switch (req.method) {
    case 'GET':
      action = 'get'
      break

    case 'POST':
      action = 'add'
      break
  }
  if (['add', 'get'].indexOf(action) === -1) {
    respondNotFound(resp)
    return
  }

  const headers = req.headers
  const msgSize = parseInt(headers['content-length']) ?? 0
  const chanName = headers['x-channel']
  const auth = headers['x-auth']

  if (mq.authKey && auth !== mq.authKey) {
    writeTextResponse(resp, 403, 'invalid auth')
    return
  }

  if (!chanName) {
    writeTextResponse(resp, 400, 'channel name required')
    return
  }

  let respMsg
  if (action === 'add') {
    const buf = await toArrayBuffer(req.readableStream())
    if (buf.byteLength !== msgSize) {
      writeTextResponse(resp, 400, 'content length mismatch')
      return
    }
    respMsg = coreHandler(
      mq,
      chanName,
      action as Action,
      new Uint8Array(buf),
    )
  } else {
    respMsg = coreHandler(
      mq,
      chanName,
      action as Action,
    )
  }
  writeResponse(
    resp,
    respMsg.statusCode,
    respMsg.contentType,
    respMsg.content,
  )
}

export function coreHandler(
  mq: MQ,
  chanName: string,
  action: Action,
  content?: Uint8Array,
): MQMessageWithStatusCode {
  const contentType = 'application/octet-stream'

  switch (action) {
    case 'add':
      if (content) {
        mq.add(chanName, content)
        return textMessage('ok')
      } else {
        return textMessage('message required', 400)
      }

    case 'get': {
      const msg = mq.remove(chanName)
      if (msg) {
        return {
          content: msg,
          contentType,
          statusCode: 200,
        }
      } else return textMessage('no message', 404)
    }

    default:
      return textMessage(`unknown action: ${action}`, 400)
  }
}
