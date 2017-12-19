// Add polyfill for `fetch`
require('whatwg-fetch');
// Add polyfill for `Promise`
require('promise-polyfill');

var cdb = require('./cartodb.js');

module.exports = cdb;
