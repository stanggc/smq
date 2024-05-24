export type Action = 'add' | 'get'
export type ChunkDataCallbackFunction = (
  chunk?: Uint8Array | string | any,
) => void

export interface MQMessage {
  content: Uint8Array
  contentType: string
}

export interface MQMessageWithStatusCode extends MQMessage {
  statusCode: number
}

export interface HTTPRequest {
  method: string
  url: string
  headers: Record<string, string>
  readableStream(): ReadableStream<Uint8Array>
}

export interface HTTPResponse {
  write(
    statusCode: number,
    headers: Record<string, string>,
    data?: Uint8Array,
  ): void
}
