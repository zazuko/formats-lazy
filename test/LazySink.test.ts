import { Readable } from 'stream'
import type { Sink } from '@rdfjs/types'
import chai, { expect } from 'chai'
import sinonChai from 'sinon-chai'
import sinon from 'sinon'
import getStream from 'get-stream'
import { lazySink } from '../LazySink.js'

chai.use(sinonChai)

describe('@zazuko/formats-lazy/lazySink', () => {
  class RealSink implements Sink<any, any> {
    public import: any

    constructor(public options?: Partial<Record<'foo' | 'bar' | 'baz', unknown>>) {
      this.import = sinon.stub().returns(Readable.from(''))
    }
  }

  const SinkProxy = lazySink<typeof RealSink>(async () => RealSink)

  it('should forward constructor parameters', async () => {
    const proxied = new SinkProxy({
      foo: 'foo',
      baz: 'baz',
    })

    const sink = await proxied.load()

    expect(sink.options).to.deep.eq({
      foo: 'foo',
      baz: 'baz',
    })
  })

  it('should forward constructor parameters to import call', async () => {
    const sink = new SinkProxy({ bar: 'bar' })

    await getStream(<any>sink.import(Readable.from(''), { foo: 'foo', baz: 'baz' }))

    const realSink = await sink.load()
    expect(realSink.import).to.have.been.calledWith([
      sinon.match(Readable),
      { foo: 'foo', baz: 'baz' },
    ])
  })
})
