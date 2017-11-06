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
 * - **source** : Source description
 * - **style** : Style description
 * - **layer** : Layer description
 * - **dataview** : Dataview description
 *
 * - **events** : The events exposed.
 * - **operation** : The operations exposed.
 */

var Client = require('./client');
var source = require('./source');
var style = require('./style');
var layer = require('./layer');
var dataview = require('./dataview');
var events = require('./events');
var operation = require('./constants').operation;

module.exports = {
  Client: Client,
  source: source,
  style: style,
  layer: layer,
  dataview: dataview,
  events: events,
  operation: operation
};
