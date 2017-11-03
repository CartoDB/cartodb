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
 * - **style** : Style description
 * - **layer** : Layer description
 * - **dataview** : Dataview description
 */

var Client = require('./client');
var source = require('./source');
var style = require('./style');
var layer = require('./layer');
var dataview = require('./dataview');
var EVENTS = require('./events');
var OPERATION = require('./constants').OPERATION;

module.exports = {
  Client: Client,
  source: source,
  style: style,
  layer: layer,
  dataview: dataview,
  EVENTS: EVENTS,
  OPERATION: OPERATION
};
