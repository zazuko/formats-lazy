import EventEmitter from 'events'
import type * as RDF from '@rdfjs/types'
import onetime from 'onetime'
import { Stream, PassThrough } from 'readable-stream'

export interface SinkConstructor<S extends RDF.Sink<EventEmitter, EventEmitter>> {
  new(...args: any[]): S
}

interface LoadSink<C extends SinkConstructor<any>> {
  (): Promise<C>
}

type SinkOutput<S> = S extends RDF.Sink<any, infer O> ? O : never
type ConstructedFrom<C> = C extends SinkConstructor<infer S> ? S : never

class LazySink<C extends SinkConstructor<any>> implements RDF.Sink<EventEmitter, EventEmitter> {
  readonly load: () => Promise<ConstructedFrom<C>>

  constructor(load: LoadSink<C>, ...args: ConstructorParameters<C>) {
    this.load = onetime(async () => {
      const Sink = await load()
      return new Sink(...args)
    })
  }

  import(stream: EventEmitter, options?: Parameters<ConstructedFrom<C>['import']>[1]): SinkOutput<ConstructedFrom<C>> {
    const passThrough = new PassThrough({ objectMode: true })
    Promise.resolve()
      .then(async () => {
        const sink = await this.load()
        // eslint-disable-next-line no-useless-call
        const origStream = <Stream><unknown>sink.import.call(sink, <any>[stream, options])
        origStream.on('prefix', (prefix, ns) => {
          passThrough.emit('prefix', prefix, ns)
        })
        origStream.on('error', err => {
          passThrough.emit('error', err)
          passThrough.emit('end')
        })
        origStream.pipe(passThrough)
      })

    return <any>passThrough
  }
}

export interface SinkProxyConstructor<C extends SinkConstructor<any>> {
  new(...args: ConstructorParameters<C>): LazySink<C>
}

export function lazySink<C extends SinkConstructor<any>>(load: LoadSink<C>): SinkProxyConstructor<C> {
  return class extends LazySink<C> {
    constructor(...args: ConstructorParameters<C>) {
      super(load, ...args)
    }
  }
}
