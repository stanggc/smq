import { IncomingHttpHeaders } from 'node:http'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { HTTPResponse, MQMessageWithStatusCode } from './types.ts'

export function toSingleValuedRecord(
  headers: IncomingHttpHeaders,
): Record<string, string> {
  const out: Record<string, string> = {}

  for (let header of Object.keys(headers)) {
    header = header.toLowerCase()
    if (Array.isArray(headers[header])) {
      out[header] = headers[header]![0]
    } else {
      if (headers[header]) {
        out[header] = headers[header] as string
      } else {
        out[header] = ''
      }
    }
  }

  return out
}

export function textMessage(
  content: string,
  statusCode: number = 200,
): MQMessageWithStatusCode {
  return {
    statusCode,
    content: Buffer.from(content),
    contentType: 'text/plain',
  }
}

export function writeResponse(
  resp: HTTPResponse,
  statusCode: number,
  contentType: string,
  content: Uint8Array,
) {
  const headers = {
    'content-type': contentType,
    'content-length': content.byteLength.toString(),
  }
  resp.write(statusCode, headers, content)
}

export function writeTextResponse(
  resp: HTTPResponse,
  statusCode: number,
  content: string,
) {
  writeResponse(resp, statusCode, 'text/plain', Buffer.from(content))
}

export function respondNotFound(
  resp: HTTPResponse,
) {
  writeTextResponse(resp, 404, 'not found')
}

export function toText(buf: Uint8Array): string {
  return new TextDecoder().decode(buf)
}

export function encodeText(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

export async function readConfigFile(
  filePath: string,
): Promise<Record<string, any>> {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}
