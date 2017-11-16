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
 * - **filter** : Filter description
 *
 * - **events** : The events exposed.
 * - **operation** : The operations exposed.
 */

if (!window.L) {
  throw new Error('Leaflet is required');
}

if (window.L.version < '1.0.0') {
  throw new Error('Leaflet +1.0 is required');
}

var Client = require('./client');
var source = require('./source');
var style = require('./style');
var layer = require('./layer');
var dataview = require('./dataview');
var filter = require('./filter');
var events = require('./events');
var operation = require('./constants').operation;

var carto = window.carto = {
  Client: Client,
  source: source,
  style: style,
  layer: layer,
  dataview: dataview,
  filter: filter,
  events: events,
  operation: operation
};

module.exports = carto;
