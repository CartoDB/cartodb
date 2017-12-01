var Base = require('./base');
var GoogleMapsBoundingBoxAdapter = require('../../../geo/adapters/gmaps-bounding-box-adapter');
var BoundingBoxFilterModel = require('../../../windshaft/filters/bounding-box');

/**
 * Bounding box filter for Google Maps maps.
 *
 * @param {L.Map} map - The map view
 *
 * @fires carto.filter.BoundingBoxGoogleMaps.boundsChanged
 *
 * @constructor
 * @extends carto.filter.Base
 * @memberof carto.filter
 * @api
 *
 */
function BoundingBoxGoogleMaps (map) {
  // Adapt the Google Maps map to offer unique:
  // - getBounds() function
  // - 'boundsChanged' event
  var mapAdapter = new GoogleMapsBoundingBoxAdapter(map);
  // Use the adapter for the internal BoundingBoxFilter model
  this._internalModel = new BoundingBoxFilterModel(mapAdapter);
  this.listenTo(this._internalModel, 'boundsChanged', this._onBoundsChanged);
}

BoundingBoxGoogleMaps.prototype = Object.create(Base.prototype);

/**
 * Return the current bounds.
 *
 * @return {carto.filter.Bounds} Current bounds
 * @api
 */
BoundingBoxGoogleMaps.prototype.getBounds = function () {
  return this._internalModel.getBounds();
};

BoundingBoxGoogleMaps.prototype._onBoundsChanged = function (bounds) {
  this.trigger('boundsChanged', bounds);
};

BoundingBoxGoogleMaps.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = BoundingBoxGoogleMaps;

/**
 * Event triggered when bounds of a bounding box filter for Google Maps changes.
 *
 * Contains a single {@link carto.filter.Bounds} argument with the new bounds.
 *
 * @event carto.filter.BoundingBoxGoogleMaps.boundsChanged
 * @type {carto.filter.Bounds}
 * @api
 */
