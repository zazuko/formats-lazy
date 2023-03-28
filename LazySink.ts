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

export interface LazySink<C extends SinkConstructor<any> = any> extends RDF.Sink<EventEmitter, EventEmitter> {
  load(): Promise<ConstructedFrom<C>>

  import: ConstructedFrom<C>['import']
}

class LazySinkImpl<C extends SinkConstructor<any>> implements LazySink<C> {
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
        const origStream = <Stream><unknown>sink.import(stream, options)
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
  return class extends LazySinkImpl<C> {
    constructor(...args: ConstructorParameters<C>) {
      super(load, ...args)
    }
  }
}
