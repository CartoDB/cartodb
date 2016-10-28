var _ = require('underscore');

/**
 * Changes the mouse pointer based on feature events and status
 * of map's interactivity.
 * @param {Object} deps Dependencies
 */
var MapCursorManager = function (deps) {
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.featureEvents) throw new Error('featureEvents is required');

  this._mapView = deps.mapView;
  this._mapModel = deps.mapModel;
  this._featureEvents = deps.featureEvents;

  this._featureEvents.on('featureOver', this._onFeatureOver, this);
  this._featureEvents.on('featureOut', this._onFeatureOut, this);

  // Map to keep track of layers that are being featured overed
  this._clickableLayersBeingFeatureOvered = {};
};

MapCursorManager.prototype._onFeatureOver = function (featureEvent) {
  var layerModel = featureEvent.layer;
  if (this._isLayerClickable(layerModel)) {
    this._clickableLayersBeingFeatureOvered[layerModel.cid] = layerModel;
    this._mapView.setCursor('pointer');
  }
};

MapCursorManager.prototype._isLayerClickable = function (layerModel) {
  return this._mapModel.isFeatureInteractivityEnabled() ||
    this._mapModel.arePopupsEnabled() && layerModel.isInfowindowEnabled();
};

MapCursorManager.prototype._onFeatureOut = function (featureEvent) {
  var layerModel = featureEvent.layer;
  delete this._clickableLayersBeingFeatureOvered[layerModel.cid];
  if (this._allClickableLayersHaveBeenFeaturedOut()) {
    this._mapView.setCursor('auto');
  }
};

MapCursorManager.prototype._allClickableLayersHaveBeenFeaturedOut = function () {
  return _.isEmpty(this._clickableLayersBeingFeatureOvered);
};

module.exports = MapCursorManager;
