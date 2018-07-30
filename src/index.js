// Add polyfill for `fetch`
require('whatwg-fetch');
// Add polyfill for `Promise`
var Promise = require('promise-polyfill');
if (!window.Promise) {
  window.Promise = Promise;
}

var cdb = require('./cartodb.js');

module.exports = cdb;
