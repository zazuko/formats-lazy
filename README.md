# @zazuko/formats-lazy
![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/zazuko/formats-lazy/test.yaml)
![npm](https://img.shields.io/npm/v/@zazuko/formats-lazy)

This module bundles parser and serializer sinks for the most common RDF formats.
Instances of [SinkMap](https://github.com/rdfjs-base/sink-map) are used to handle different media types.

Every sink is loaded lazily when it is first used, making this package the best choice for web application. The laziness
is transparent to the consuming code because streams are already lazy by definition.

## Recommended usage

Install [`@rdfjs/environment`](https://npm.im/@rdfjs/environment) and create an environment with the factories you need, including `FormatsFactory`.
Then, import the lazy formats.

```js
import Environment from '@rdfjs/environment/Environment.js'
import FormatsFactory from '@rdfjs/environment/Formats.js'
import lazyFormats from '@zazuko/formats-lazy'

export const $rdf = new Environment([FormatsFactory])

$rdf.formats.import(lazyFormats)
```

## Simple usage

Use an existing environment, such as [`rdf-ext`](https://npm.im/rdf-ext)

```js
import $rdf from 'rdf-ext'
import lazyFormats from '@zazuko/formats-lazy'

$rdf.formats.import(lazyFormats)
```

## Direct usage

The formats object has a `parsers` and `serializers` property.
Each of it is an instance of `SinkMap` with the most common RDF media types as key.

## Example

```javascript
import formats from '@zazuko/formats-lazy'
import { Readable } from 'readable-stream'

const input = Readable.from([`
  PREFIX s: <http://schema.org/>

  [] a s:Person;
    s:jobTitle "Professor";
    s:name "Jane Doe";
    s:telephone "(425) 123-4567";
    s:url <http://www.janedoe.com>.
`])

const output = formats.parsers.import('text/turtle', input)

output.on('data', quad => {
  console.log(`quad: ${quad.subject.value} - ${quad.predicate.value} - ${quad.object.value}`)
})

output.on('prefix', (prefix, ns) => {
  console.log(`prefix: ${prefix} ${ns.value}`)
})
```
