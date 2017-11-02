/**
 *  @api
 *  @namespace carto
 *
 *  @description
 *  # Carto.js
 *  All the library features are exposed through the `carto` namespace.
 *
 *
 * - **Client** : The api client.
 * - **Events** : The events exposed.
 * - **source** : Source description
 */

var Client = require('./client');
var source = require('./source');
var style = require('./style');
var layer = require('./layer');
var Events = require('./events');
var dataview = require('./dataview');
var OPERATION = require('./constants').OPERATION;

module.exports = {
  Client: Client,
  Events: Events,
  source: source,
  style: style,
  layer: layer,
  dataview: dataview,
  operation: OPERATION
};
