var Base = require('./base');
var LeafletBoundingBoxAdapter = require('../../../geo/adapters/leaflet-bounding-box-adapter');
var BoundingBoxFilterModel = require('../../../windshaft/filters/bounding-box');

/**
 * Bounding box filter for Leaflet maps
 *
 * @param {L.Map} map - The map view
 *
 * @constructor
 * @extends carto.filter.Base
 * @memberof carto.filter
 * @api
 *
 */
function BoundingBoxLeaflet (map) {
  // Adapt the Leaflet map to offer unique:
  // - getBounds() function
  // - 'boundsChanged' event
  var mapAdapter = new LeafletBoundingBoxAdapter(map);
  // Use the adapter for the internal BoundingBoxFilter model
  this._internalModel = new BoundingBoxFilterModel(mapAdapter);
}

BoundingBoxLeaflet.prototype = Object.create(Base.prototype);

BoundingBoxLeaflet.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = BoundingBoxLeaflet;
