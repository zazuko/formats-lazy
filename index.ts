import type JsonLdParserImpl from '@rdfjs/parser-jsonld'
import type N3ParserImpl from '@rdfjs/parser-n3'
import type NTriplesSerializerImpl from '@rdfjs/serializer-ntriples'
import SinkMap from '@rdfjs/sink-map'
import type JsonLdSerializerImpl from './lib/CustomJsonLdSerializer.js'
import type RdfXmlParserImpl from './lib/CustomRdfXmlParser.js'
import { lazySink } from './LazySink.js'

const parsers = new SinkMap()
const serializers = new SinkMap()

const formats = {
  parsers,
  serializers,
}

const JsonLdParser = lazySink<typeof JsonLdParserImpl>(async () => (await import('@rdfjs/parser-jsonld')).default)
const N3Parser = lazySink<typeof N3ParserImpl>(async () => (await import('@rdfjs/parser-n3')).default)
const RdfXmlParser = lazySink<typeof RdfXmlParserImpl>(async () => (await import('./lib/CustomRdfXmlParser.js')).default)
const NTriplesSerializer = lazySink<typeof NTriplesSerializerImpl>(async () => (await import('@rdfjs/serializer-ntriples')).default)
const JsonLdSerializer = lazySink<typeof JsonLdSerializerImpl>(async () => (await import('./lib/CustomJsonLdSerializer.js')).default)

formats.parsers.set('application/ld+json', new JsonLdParser())
formats.parsers.set('application/trig', new N3Parser())
formats.parsers.set('application/n-quads', new N3Parser())
formats.parsers.set('application/n-triples', new N3Parser())
formats.parsers.set('text/n3', new N3Parser())
formats.parsers.set('text/turtle', new N3Parser())
formats.parsers.set('application/rdf+xml', new RdfXmlParser())

formats.serializers.set('application/ld+json', new JsonLdSerializer())
formats.serializers.set('application/n-quads', new NTriplesSerializer())
formats.serializers.set('application/n-triples', new NTriplesSerializer())
formats.serializers.set('text/n3', new NTriplesSerializer())
formats.serializers.set('text/turtle', new NTriplesSerializer())

export { parsers, serializers }
export default formats
export {
  JsonLdParser,
  JsonLdSerializer,
  N3Parser,
  NTriplesSerializer,
  RdfXmlParser,
}
