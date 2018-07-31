/**
 *  @api
 *  @namespace carto
 *
 *  @description
 *  # CARTO.js
 *  All the library features are exposed through the `carto` namespace.
 *
 *
 * - **Client** : The api client.
 * - **source** : Source description
 * - **style** : Style description
 * - **layer** : Layer description
 * - **dataview** : Dataview description
 * - **filter** : Filter description
 * - **events** : The events exposed.
 * - **operation** : The operations exposed.
 */

// Add polyfill for `fetch`
require('whatwg-fetch');
// Add polyfill for `Promise`
var Promise = require('promise-polyfill');
if (!window.Promise) {
  window.Promise = Promise;
}

var Client = require('./client');
var source = require('./source');
var style = require('./style');
var layer = require('./layer');
var dataview = require('./dataview');
var filter = require('./filter');
var events = require('./events');
var constants = require('./constants');

var carto = {
  version: require('../../../package.json').version,
  ATTRIBUTION: constants.ATTRIBUTION,
  Client: Client,
  source: source,
  style: style,
  layer: layer,
  dataview: dataview,
  filter: filter,
  events: events,
  operation: constants.operation
};

module.exports = carto;
