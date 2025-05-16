import assert, { strictEqual } from 'assert'
import { Readable } from 'node:stream'
import type { Quad } from '@rdfjs/types'
import JsonLdParser from '@rdfjs/parser-jsonld'
import N3Parser from '@rdfjs/parser-n3'
import NTriplesSerializer from '@rdfjs/serializer-ntriples'
import SinkMap from '@rdfjs/sink-map'
import namespace from '@rdfjs/namespace'
import { expect } from 'chai'
import getStream from 'get-stream'
import $rdf from 'rdf-ext'
import { nquads, turtle } from '@tpluscode/rdf-string'
import formats from '../index.js'
import * as all from '../index.js'
import JsonLdSerializer from '../lib/CustomJsonLdSerializer.js'
import RdfXmlParser from '../lib/CustomRdfXmlParser.js'
import { LazySink } from '../LazySink.js'

const ex = namespace('https://example.com/')

function testMediaType(map: SinkMap<any, any>, mediaType: string, name: string, implementation: any) {
  describe(mediaType, () => {
    it('should be supported', () => {
      strictEqual(map.has(mediaType), true)
    })

    it(`should use ${name}`, async () => {
      const sink = <LazySink>map.get(mediaType)

      strictEqual(await sink.load() instanceof implementation, true)
    })
  })
}

describe('@zazuko/formats-lazy', () => {
  describe('exports', () => {
    it('should export all parsers as SinkMap', () => {
      strictEqual(all.parsers instanceof SinkMap, true)
      strictEqual(all.parsers.size, 7)
    })

    it('should export all serializers as SinkMap', () => {
      strictEqual(all.serializers instanceof SinkMap, true)
      strictEqual(all.serializers.size, 5)
    })
  })

  describe('parsers', () => {
    it('should implement the Map interface', () => {
      strictEqual(typeof formats.parsers.get, 'function')
      strictEqual(typeof formats.parsers.has, 'function')
      strictEqual(typeof formats.parsers.set, 'function')
    })

    it('should implement .import', () => {
      strictEqual(typeof formats.parsers.import, 'function')
    })

    it('should parse JSON-LD', async () => {
      const input = Readable.from(JSON.stringify({
        '@id': ex.Foo.value,
        [ex.bar.value]: '123',
      }))

      const [actual] = await getStream.array<Quad>(<any>formats.parsers.import('application/ld+json', input))

      const expected = $rdf.quad(ex.Foo, ex.bar, $rdf.literal('123'))
      assert(expected.equals(actual))
    })

    it('should parse n3', async () => {
      const input = Readable.from(turtle`${ex.Foo} ${ex.bar} "123" .`.toString())

      const [actual] = await getStream.array<Quad>(<any>formats.parsers.import('text/n3', input))

      const expected = $rdf.quad(ex.Foo, ex.bar, $rdf.literal('123'))
      assert(expected.equals(actual))
    })

    it('should parse turtle', async () => {
      const input = Readable.from(turtle`${ex.Foo} ${ex.bar} "123" .`.toString())

      const [actual] = await getStream.array<Quad>(<any>formats.parsers.import('text/turtle', input))

      const expected = $rdf.quad(ex.Foo, ex.bar, $rdf.literal('123'))
      assert(expected.equals(actual))
    })

    it('should parse n-triples', async () => {
      const input = Readable.from(nquads`${ex.Foo} ${ex.bar} "123" .`.toString())

      const [actual] = await getStream.array<Quad>(<any>formats.parsers.import('application/n-triples', input))

      const expected = $rdf.quad(ex.Foo, ex.bar, $rdf.literal('123'))
      assert(expected.equals(actual))
    })

    it('should parse n-quads', async () => {
      const input = Readable.from(nquads`${ex.Foo} ${ex.bar} "123" ${ex.Baz} .`.toString())

      const [actual] = await getStream.array<Quad>(<any>formats.parsers.import('application/n-quads', input))

      const expected = $rdf.quad(ex.Foo, ex.bar, $rdf.literal('123'), ex.Baz)
      assert(expected.equals(actual))
    })

    it('should parse trig', async () => {
      const input = Readable.from(turtle`${ex.Baz} { ${ex.Foo} ${ex.bar} "123" . }`.toString())

      const [actual] = await getStream.array<Quad>(<any>formats.parsers.import('text/turtle', input))

      const expected = $rdf.quad(ex.Foo, ex.bar, $rdf.literal('123'), ex.Baz)
      assert(expected.equals(actual))
    })

    it('should parse RDF/XML', async () => {
      const input = Readable.from(`<?xml version="1.0" encoding="utf-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
  <rdf:Description rdf:about="https://example.com/Foo">
    <__g0:bar xmlns:__g0="https://example.com/">123</__g0:bar>
  </rdf:Description>
</rdf:RDF>`)

      const [actual] = await getStream.array<Quad>(<any>formats.parsers.import('application/rdf+xml', input))

      const expected = $rdf.quad(ex.Foo, ex.bar, $rdf.literal('123'))
      assert(expected.equals(actual))
    })

    it('return null when given an unsupported format', () => {
      // when
      const stream = formats.parsers.import('text/plain', Readable.from(''))

      // then
      expect(stream).to.be.null
    })

    it('should throw when input is malformed', async () => {
      // given
      const invaliInput = Readable.from('foobar')

      // then
      await expect(
        // when
        getStream.array(<Readable>formats.parsers.import('text/turtle', invaliInput)),
      ).to.eventually.be.rejectedWith(/^Unexpected "foobar" on line 1\.$/)
    })

    testMediaType(formats.parsers, 'application/ld+json', '@rdfjs/parser-jsonld', JsonLdParser)
    testMediaType(formats.parsers, 'application/trig', '@rdfjs/parser-n3', N3Parser)
    testMediaType(formats.parsers, 'application/n-quads', '@rdfjs/parser-n3', N3Parser)
    testMediaType(formats.parsers, 'application/n-triples', '@rdfjs/parser-n3', N3Parser)
    testMediaType(formats.parsers, 'text/n3', '@rdfjs/parser-n3', N3Parser)
    testMediaType(formats.parsers, 'text/turtle', '@rdfjs/parser-n3', N3Parser)
    testMediaType(formats.parsers, 'application/rdf+xml', 'rdfxml-streaming-parser', RdfXmlParser)
  })

  describe('serializers', () => {
    it('should contain serializers all defined media types', () => {
      strictEqual(formats.serializers.has('application/ld+json'), true)
      strictEqual(formats.serializers.has('application/n-quads'), true)
      strictEqual(formats.serializers.has('application/n-triples'), true)
      strictEqual(formats.serializers.has('text/n3'), true)
      strictEqual(formats.serializers.has('text/turtle'), true)
    })

    it('should implement the Map interface', () => {
      strictEqual(typeof formats.serializers.get, 'function')
      strictEqual(typeof formats.serializers.has, 'function')
      strictEqual(typeof formats.serializers.set, 'function')
    })

    it('should implement .import', () => {
      strictEqual(typeof formats.serializers.import, 'function')
    })

    ;(<Array<[string, boolean]>>[
      ['application/ld+json', true],
      ['application/n-quads', true],
      ['application/n-triples', false],
      ['text/n3', false],
      ['text/turtle', false],
    ]).forEach(([format, datasetFormat]) => {
      it(`should serialize ${format}`, async function () {
        const quad = $rdf.quad(
          ex.Foo,
          ex.bar,
          $rdf.literal('123'),
          datasetFormat ? ex.Baz : $rdf.defaultGraph(),
        )
        const dataset = $rdf.dataset([quad])

        const output = await getStream(<any>formats.serializers.import(format, dataset.toStream()))

        expect(output).to.matchSnapshot(this)
      })
    })

    it('return null when given an unsupported format', () => {
      // when
      const stream = formats.serializers.import('text/plain', Readable.from([]))

      // then
      expect(stream).to.be.null
    })

    testMediaType(formats.serializers, 'application/ld+json', '@rdfjs/serializer-jsonld', JsonLdSerializer)
    testMediaType(formats.serializers, 'application/n-quads', '@rdfjs/serializer-ntriples', NTriplesSerializer)
    testMediaType(formats.serializers, 'application/n-triples', '@rdfjs/serializer-ntriples', NTriplesSerializer)
    testMediaType(formats.serializers, 'text/n3', '@rdfjs/serializer-ntriples', NTriplesSerializer)
    testMediaType(formats.serializers, 'text/turtle', '@rdfjs/serializer-ntriples', NTriplesSerializer)
  })
})
