# camshaft-reference

camshaft-reference is a JSON specification for [camshaft](https://github.com/CartoDB/camshaft) analyses.

## Meaning

The structure of the file is as such:

* `version`: the version of camshaft targeted.
* `analyses`: named analyses supported by camshaft, with information about their parameters.

## Using

This is a valid [npm](https://www.npmjs.com/) module and therefore can easily be consumed as any other package:

```
npm install camshaft-reference
```

After installed within your project you can:

```js
var reference = require('camshaft-reference');
var ref = reference.getVersion('latest');
```

Or list all available versions:

```js
var reference = require('camshaft-reference');
reference.versions;
[ '0.1.0' ]
```

## Thanks

This is inspired by [mapnik-reference](https://github.com/mapnik/mapnik-reference), *it is useful for building parsers,
tests, compilers, and syntax highlighting/checking for languages.*
