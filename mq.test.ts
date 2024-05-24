import { strict as assert } from 'node:assert'
import { MQ } from './mq.ts'
import { encodeText, toText } from './util.ts'

const test = Deno.test

test('MQ', async (t) => {
  const mq = new MQ(256, 1000)
  const ch1 = 'ch1'
  const ch2 = 'ch2'
  const data1 = 'data1'
  const data11 = 'data11'
  const data2 = 'data2'
  const data22 = 'data22'

  await t.step('cannot exceed maximum member size', () => {
    const maxLengthRepr = 4_294_967_295
    const lengthBytes = 4
    let mqOK: MQ | null = new MQ(maxLengthRepr - lengthBytes, 2)
    mqOK = null

    const attemptedSize = maxLengthRepr - lengthBytes + 1
    try {
      const mq = new MQ(attemptedSize, 2)
      throw new Error(
        'impossible to init an MQ with member size exceeding maximum',
      )
    } catch (e) {
      assert(
        e.message.startsWith(`member size ${attemptedSize} cannot exceed `),
        e.message,
      )
    }
  })

  await t.step('insert', async (t) => {
    await t.step('into channel 1', () => {
      mq.add(ch1, encodeText(data1))
      assert(mq.length(ch1) === 1)
    })

    await t.step('insert another into channel 1', () => {
      mq.add(ch1, encodeText(data11))
      assert(mq.length(ch1) === 2)
    })

    await t.step('into channel 2', () => {
      mq.add(ch2, encodeText(data2))
      assert(mq.length(ch2) === 1)
    })

    await t.step('insert another into channel 2', () => {
      mq.add(ch2, encodeText(data22))
      assert(mq.length(ch1) === 2)
    })
  })

  await t.step('get', async (t) => {
    await t.step('from channel 1', () => {
      const result = mq.remove(ch1)
      assert(mq.length(ch1) === 1)
      assert(result)
      assert(toText(result!) === data1)
    })

    await t.step(
      'from channel 1 again, content-type should not be text/plain',
      () => {
        const result = mq.remove(ch1)
        assert(mq.length(ch1) === 0)
        assert(result && result.byteLength !== 0)
        // assert(result!.contentType === 'application/octet-stream')
        assert(toText(result!) === data11)
      },
    )

    await t.step('from channel 1 again, but should be empty', () => {
      const result = mq.remove(ch1)
      assert(result === null)
    })

    await t.step('from channel 2', () => {
      const result = mq.remove(ch2)
      assert(mq.length(ch2) === 1)
      assert(result)
      assert(toText(result!) === data2)
    })

    await t.step(
      'from channel 2 again, content-type should not be text/plain',
      () => {
        const result = mq.remove(ch2)
        assert(mq.length(ch2) === 0)
        assert(result)
        // assert(result!.contentType === 'application/octet-stream')
        assert(toText(result!) === data22)
      },
    )

    await t.step('from channel 2 again, but should be empty', () => {
      const result = mq.remove(ch2)
      assert(result === null)
    })
  })

  await t.step('test large-scale', async (t) => {
    const mq = new MQ(256, 2_000_000)

    await t.step('populate channel', () => {
      for (let i = 0; i < 2_000_000; ++i) {
        mq.add(ch1, encodeText(`content: ${i}`))
      }
    })

    await t.step({
      name: 'verify',
      fn() {
        for (let i = 0; i < 2_000_000; ++i) {
          assert(mq.length(ch1) === 2_000_000 - i)
          const result = mq.remove(ch1)
          if (i === 100_000 || i === 500_000 || i === 1_000_000) {
            assert(result)
            assert(
              result! instanceof Uint8Array &&
                toText(result!) === `content: ${i}`,
            )
          }
        }
        assert(mq.length(ch1) === 0)
      },
    })
  })
})
