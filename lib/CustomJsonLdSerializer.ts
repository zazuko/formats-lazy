import JsonLdSerializer, { SerializerOptions } from '@rdfjs/serializer-jsonld'

class CustomJsonLdSerializer extends JsonLdSerializer {
  constructor({ ...args }: SerializerOptions = {}) {
    super({ encoding: 'string', ...args })
  }
}

export default CustomJsonLdSerializer
