var Layer = require('./layer');
var EventTypes = require('./event-types');
var Aggregation = require('./aggregation');

/**
 *  @namespace carto.layer
 *  @api
 */
module.exports = {
  Aggregation: Aggregation,
  Layer: Layer,
  events: EventTypes
};

/**
 *  @namespace carto.layer.metadata
 *  @api
 */
