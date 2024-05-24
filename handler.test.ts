import { strict as assert } from 'node:assert'

import { coreHandler, httpHandler } from './handler.ts'
import { MQ } from './mq.ts'
import { HTTPRequest, HTTPResponse } from './types.ts'
import { encodeText, toText } from './util.ts'

const test = Deno.test

interface TestHTTPRequest extends HTTPRequest {}

interface TestHTTPResponse extends HTTPResponse {
  statusCode: number
  headers: Record<string, string>
  data?: Uint8Array
}

class HTTPRequestForTest implements TestHTTPRequest {
  method: string
  url: string
  headers: Record<string, string>
  data?: Uint8Array

  constructor(method: string, url?: string, data?: Uint8Array) {
    this.method = method
    this.url = url ?? ''
    this.headers = {}
    this.data = data
  }

  readableStream() {
    if (this.method === 'GET') {
      throw new Error(
        'HTTP handler should not even attempt to read body for a GET request',
      )
    } else {
      if (this.data) {
        return ReadableStream.from<Uint8Array>([this.data])
      } else {
        return ReadableStream.from([])
      }
    }
  }
}

class HTTPResponseForTest implements TestHTTPResponse {
  statusCode: number
  headers: Record<string, string>
  data?: Uint8Array

  constructor() {
    this.statusCode = 0
    this.headers = {}
  }

  write(statusCode: number, headers: Record<string, string>, data: Uint8Array) {
    this.statusCode = statusCode
    this.headers = headers
    this.data = data
  }
}

test('core handler', async (t) => {
  const mq = new MQ(256, 50_000)
  const ch1 = 'ch1'
  const ch2 = 'ch2'

  await t.step('`get` from empty channel', () => {
    // Get from channel 1 first. Should be null.
    const result = coreHandler(mq, ch1, 'get')
    assert(result)
    assert(result.statusCode === 404)
    assert(result.contentType === 'text/plain')
    assert(
      result.content instanceof Uint8Array &&
        toText(result.content) === 'no message',
    )
  })

  await t.step('`add` then `get` actions', () => {
    // Insert into channel 1.
    let result = coreHandler(
      mq,
      ch1,
      'add',
      encodeText('Hello1'),
    )
    assert(result)
    assert(result.statusCode === 200)
    assert(result.contentType === 'text/plain')
    assert(
      result.content instanceof Uint8Array && toText(result.content) === 'ok',
    )

    // Insert into channel 2.
    result = coreHandler(
      mq,
      ch2,
      'add',
      encodeText('Hello2'),
    )
    assert(result)
    assert(
      result.content instanceof Uint8Array && toText(result.content) === 'ok',
    )

    // Get from channel 1.
    result = coreHandler(mq, ch1, 'get')
    assert(result)
    assert(result.statusCode === 200)
    assert(result.contentType === 'application/octet-stream')
    assert(
      result.content instanceof Uint8Array &&
        toText(result.content) === 'Hello1',
    )

    // Get from channel 1 again. Should be null.
    result = coreHandler(mq, ch1, 'get')
    assert(result)
    assert(result.statusCode === 404)
    assert(
      result.content instanceof Uint8Array &&
        toText(result.content) === 'no message',
    )

    // Get from channel 2.
    result = coreHandler(mq, ch2, 'get')
    assert(result)
    assert(result.statusCode === 200)
    assert(
      result.content instanceof Uint8Array &&
        toText(result.content) === 'Hello2',
    )

    // Get from channel 2 again. Should be null.
    result = coreHandler(mq, ch2, 'get')
    assert(result)
    assert(result.statusCode === 404)
    assert(
      result.content instanceof Uint8Array &&
        toText(result.content) === 'no message',
    )
  })
})

test('HTTP handler', async (t) => {
  await t.step('auth required', async (t) => {
    const authKey = 'auth123'
    const mq = new MQ(256, 50_000, authKey)
    const data = 'test123'
    const encodedData = encodeText(data)
    const ch1 = 'ch1'

    await t.step('auth header provided', async (t) => {
      await t.step('correct auth header during GET', async (t) => {
        const req = new HTTPRequestForTest('GET', '/msg')
      })

      await t.step('correct auth header', async (t) => {
        const req = new HTTPRequestForTest('POST', '/msg', encodedData)
        req.headers['content-type'] = 'text/plain'
        req.headers['content-length'] = encodedData.byteLength.toString()
        req.headers['x-auth'] = authKey
        req.headers['x-channel'] = ch1
        const resp = new HTTPResponseForTest()
        await httpHandler(mq, req, resp)
        assert(resp.statusCode === 200)
        assert(resp.headers['content-type'] === 'text/plain')
        assert(
          resp.data instanceof Uint8Array && toText(resp.data) === 'ok',
        )

        await t.step(
          'missing required header returns appropriate error',
          async () => {
            const req = new HTTPRequestForTest('POST', '/msg', encodedData)
            req.headers['content-type'] = 'text/plain'
            req.headers['content-length'] = encodedData.byteLength.toString()
            req.headers['x-auth'] = authKey
            // NOTE missing x-channel.

            const resp = new HTTPResponseForTest()
            await httpHandler(mq, req, resp)
            assert(resp.statusCode === 400)
            assert(resp.headers['content-type'] === 'text/plain')
            assert(
              resp.data instanceof Uint8Array &&
                toText(resp.data) === 'channel name required',
            )
          },
        )
      })

      await t.step('incorrect auth header', async (t) => {
        const req = new HTTPRequestForTest('POST', '/msg', encodedData)
        req.headers['content-type'] = 'text/plain'
        req.headers['content-length'] = encodedData.byteLength.toString()
        req.headers['x-auth'] = 'wrongauthkey'
        req.headers['x-channel'] = ch1
        const resp = new HTTPResponseForTest()
        await httpHandler(mq, req, resp)
        assert(resp.statusCode === 403)
        assert(resp.headers['content-type'] === 'text/plain')
        assert(
          resp.data instanceof Uint8Array &&
            toText(resp.data) === 'invalid auth',
        )

        await t.step(
          'missing required header responds with invalid auth first instead',
          async () => {
            const req = new HTTPRequestForTest('POST', '/msg', encodedData)
            req.headers['content-type'] = 'text/plain'
            req.headers['content-length'] = encodedData.byteLength.toString()

            req.headers['x-auth'] = 'wrongauthkey'
            // NOTE missing x-channel.
            const resp = new HTTPResponseForTest()
            await httpHandler(mq, req, resp)
            assert(resp.statusCode === 403)
            assert(resp.headers['content-type'] === 'text/plain')
            assert(
              resp.data instanceof Uint8Array &&
                toText(resp.data) === 'invalid auth',
            )
          },
        )
      })
    })

    await t.step('auth header not provided', async () => {
      const req = new HTTPRequestForTest('POST', '/msg', encodedData)
      req.headers['content-type'] = 'text/plain'
      req.headers['content-length'] = encodedData.byteLength.toString()
      req.headers['x-channel'] = ch1
      const resp = new HTTPResponseForTest()
      await httpHandler(mq, req, resp)
      assert(resp.statusCode === 403)
      assert(resp.headers['content-type'] === 'text/plain')
      assert(
        resp.data instanceof Uint8Array &&
          toText(resp.data) === 'invalid auth',
      )
    })
  })

  await t.step('auth not required', async (t) => {
    const mq = new MQ(256, 50_000)
    const data = 'data1'
    const encodedData = encodeText(data)
    const ch1 = 'ch1'

    await t.step('wrong URL', () => {
      const req = new HTTPRequestForTest('GET', '/notapi')
      const resp = new HTTPResponseForTest()
      httpHandler(mq, req, resp)
      assert(resp.statusCode === 404)
      assert(resp.headers['content-type'] === 'text/plain')
      assert(
        resp.data instanceof Uint8Array && toText(resp.data) === 'not found',
      )
    })

    await t.step('correct URL, but incorrect method', async () => {
      const req = new HTTPRequestForTest('PATCH', '/msg')
      const resp = new HTTPResponseForTest()
      await httpHandler(mq, req, resp)
      assert(resp.statusCode === 404)
      assert(
        resp.data instanceof Uint8Array &&
          toText(resp.data) === 'not found',
      )
    })

    await t.step('`add` API action', async (t) => {
      const req = new HTTPRequestForTest('POST', '/msg', encodedData)
      req.headers['content-length'] = encodedData.byteLength.toString()
      req.headers['content-type'] = 'text/plain'
      req.headers['x-channel'] = ch1
      const resp = new HTTPResponseForTest()
      await httpHandler(mq, req, resp)

      assert(resp.statusCode === 200)
      assert(resp.headers['content-type'] === 'text/plain')
      assert(resp.headers['content-length'] === '2')
      assert(
        resp.data instanceof Uint8Array &&
          toText(resp.data) === 'ok',
      )

      await t.step('channel name header not provided', async () => {
        const req = new HTTPRequestForTest('POST', '/msg', encodedData)
        req.headers['content-length'] = encodedData.byteLength.toString()
        req.headers['content-type'] = 'text/plain'
        // NOTE missing channel name
        const resp = new HTTPResponseForTest()
        await httpHandler(mq, req, resp)

        assert(resp.statusCode === 400)
        assert(resp.headers['content-type'] === 'text/plain')
        assert(
          resp.data instanceof Uint8Array &&
            toText(resp.data) === 'channel name required',
        )
      })

      await t.step('content length mismatch', async () => {
        const req = new HTTPRequestForTest('POST', '/msg', encodedData)
        req.headers['content-length'] = encodedData.byteLength.toString() + '0'
        req.headers['content-type'] = 'text/plain'
        req.headers['x-channel'] = ch1
        const resp = new HTTPResponseForTest()
        await httpHandler(mq, req, resp)

        assert(resp.statusCode === 400)
        assert(resp.headers['content-type'] === 'text/plain')
        assert(
          resp.data instanceof Uint8Array &&
            toText(resp.data) === 'content length mismatch',
        )
      })
    })

    await t.step('`get` API action', async (t) => {
      const req = new HTTPRequestForTest('GET', '/msg')
      req.headers['x-channel'] = ch1
      const resp = new HTTPResponseForTest()
      await httpHandler(mq, req, resp)

      assert(resp.statusCode === 200)
      assert(
        resp.headers['content-length'] === encodedData.byteLength.toString(),
      )
      assert(
        resp.data instanceof Uint8Array &&
          toText(resp.data) === data.toString(),
      )

      await t.step(
        'get again from same channel but should be empty',
        async () => {
          const req = new HTTPRequestForTest('GET', '/msg')
          req.headers['x-channel'] = ch1
          const resp = new HTTPResponseForTest()
          await httpHandler(mq, req, resp)

          assert(resp.statusCode === 404)
          assert(
            resp.data instanceof Uint8Array &&
              toText(resp.data) === 'no message',
          )
        },
      )
    })
  })
})
