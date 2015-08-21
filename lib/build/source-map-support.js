// Buffer is an implicit dependency for source-map-support module, retrieved in this context through the browserify
// module. At the time of writing uses the latest version 3.4.2 of the buffer module, definition at:
// https://github.com/substack/node-browserify/blob/11.0.1/package.json#L28
//
// Unfortunately, this version throws an `Uncaught RangeError: Maximum call stack size exceeded` exception,
// when decoding the base64 sourcemap (https://github.com/evanw/node-source-map-support/blob/master/source-map-support.js#L111)
//
// The temporary workaround to this exception is to override the implicit dependency and use the latest HEAD of the
// module that contains a fix (see https://github.com/feross/buffer/commit/c681bda).
// Once a version 3.4.3 (or higher) is released of buffer module we can remove this line and remove it from package.json
window.Buffer = require('buffer');

/**
 * See https://github.com/evanw/node-source-map-support#browser-support
 * This is expected to be included in a browserify-module to give proper stack traces, based on browserify's source maps.
 */
require('source-map-support').install();
