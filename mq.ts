class Queue {
  private _memberSize: number
  private _capacity: number
  private _length: number
  private buf: ArrayBuffer
  private startIndex: number
  private endIndex: number
  private static lengthBytes = 4 // bytes / Uint32.
  static maxMemberSize = 4_294_967_295 - Queue.lengthBytes

  static isMemberSizeOK(memberSize: number) {
    return memberSize <= Queue.maxMemberSize
  }

  constructor(memberSize: number, capacity: number) {
    if (!Queue.isMemberSizeOK(memberSize)) {
      throw new Error(
        `member size ${memberSize} cannot exceed ${Queue.maxMemberSize}`,
      )
    }

    this._memberSize = memberSize
    this._capacity = capacity
    this.buf = new ArrayBuffer(this.totalMemberSize * this._capacity)
    this.startIndex = 0
    this.endIndex = 0
    this._length = 0
  }

  get memberSize() {
    return this._memberSize
  }

  get capacity() {
    return this._capacity
  }

  get length() {
    return this._length
  }

  get newIndex() {
    if (this.length === 0) {
      return this.startIndex
    } else {
      let nIndex = this.endIndex + 1
      if (nIndex >= this.capacity) nIndex = 0
      return nIndex
    }
  }

  private get totalMemberSize() {
    return this._memberSize + Queue.lengthBytes
  }

  private indexOfContentLengthInBuf(index: number) {
    return index * this.totalMemberSize
  }

  private indexOfContentInBuf(index: number) {
    return index * this.totalMemberSize + Queue.lengthBytes
  }

  add(content: Uint8Array) {
    if (this.length + 1 > this.capacity) throw new Error('queue at capacity')

    const newIndex = this.newIndex

    const length = new Uint32Array(
      this.buf,
      this.indexOfContentLengthInBuf(newIndex),
      1,
    )
    length[0] = content.byteLength
    const cStartIndex = this.indexOfContentInBuf(newIndex)
    const bufContent = new Uint8Array(this.buf, cStartIndex, this.memberSize)
    for (let i = 0; i < content.byteLength; ++i) {
      bufContent[i] = content[i]
    }

    ;++this._length
    this.endIndex = newIndex
  }

  remove(): Uint8Array | null {
    if (this.length === 0) return null

    const cStartIndex = this.indexOfContentInBuf(this.startIndex)
    const length = new Uint32Array(
      this.buf,
      this.indexOfContentLengthInBuf(this.startIndex),
      1,
    )
    const content = new Uint8Array(this.buf, cStartIndex, length[0])
    const contentCopy = new Uint8Array(content)
    // Before returning, zero the slot.
    for (let i = 0; i < this.memberSize; ++i) {
      content[i] = 0
    }
    length[0] = 0
    ;--this._length
    ;++this.startIndex
    if (this.startIndex >= this.capacity) this.startIndex = 0

    return contentCopy
  }
}

export class MQ {
  private channels: Record<string, Queue>
  private _memberSize: number
  private _capacity: number
  authKey?: string

  constructor(memberSize: number, capacity: number, authKey?: string) {
    if (!Queue.isMemberSizeOK(memberSize)) {
      throw new Error(
        `member size ${memberSize} cannot exceed ${Queue.maxMemberSize}`,
      )
    }

    this._memberSize = memberSize
    this._capacity = capacity
    this.channels = {}
    this.authKey = authKey
  }

  get memberSize() {
    return this._memberSize
  }

  get capacity() {
    return this._capacity
  }

  add(chanName: string, content: Uint8Array) {
    if (!this.channels[chanName]) {
      this.channels[chanName] = new Queue(this.memberSize, this.capacity)
    }
    const channel = this.channels[chanName]
    channel.add(content)
  }

  remove(chanName: string) {
    const channel = this.channels[chanName]
    if (!channel) return null
    const out = channel.remove()
    return out ? out : null
  }

  length(chanName: string) {
    if (!this.channels[chanName]) return 0
    return this.channels[chanName].length
  }
}
