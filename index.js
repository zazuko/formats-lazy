const JsonLdParser = require('@rdfjs/parser-jsonld')
const N3Parser = require('@rdfjs/parser-n3')
const { RdfXmlParser } = require('rdfxml-streaming-parser')
const JsonLdSerializer = require('@rdfjs/serializer-jsonld')
const NTriplesSerializer = require('@rdfjs/serializer-ntriples')
const SinkMap = require('@rdfjs/sink-map')

const formats = {
  parsers: new SinkMap(),
  serializers: new SinkMap()
}

formats.parsers.set('application/ld+json', new JsonLdParser())
formats.parsers.set('application/trig', new N3Parser())
formats.parsers.set('application/n-quads', new N3Parser())
formats.parsers.set('application/n-triples', new N3Parser())
formats.parsers.set('text/n3', new N3Parser())
formats.parsers.set('text/turtle', new N3Parser())
formats.parsers.set('application/rdf+xml', new RdfXmlParser())

formats.serializers.set('application/ld+json', new JsonLdSerializer({ encoding: 'string' }))
formats.serializers.set('application/n-quads', new NTriplesSerializer())
formats.serializers.set('application/n-triples', new NTriplesSerializer())
formats.serializers.set('text/n3', new NTriplesSerializer())
formats.serializers.set('text/turtle', new NTriplesSerializer())

module.exports = formats
