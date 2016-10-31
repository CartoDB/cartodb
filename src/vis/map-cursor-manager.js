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

  // Map to keep track of clickable layers that are being feature overed
  this._clickableLayersBeingFeatureOvered = {};
};

MapCursorManager.prototype._onFeatureOver = function (featureEvent) {
  if (this._isLayerClickable(featureEvent.layer) &&
    !this._isLayerBeingFeatureOvered(featureEvent.layer)) {
    this._markLayerAsFeatureOvered(featureEvent.layer);
    this._updateMousePointer();
  }
};

MapCursorManager.prototype._onFeatureOut = function (featureEvent) {
  this._unmarkLayerAsFeatureOvered(featureEvent.layer);
  this._updateMousePointer();
};

MapCursorManager.prototype._onLayerVisibilityChanged = function (layerModel) {
  if (!layerModel.isVisible()) {
    this._unmarkLayerAsFeatureOvered(layerModel);
    this._updateMousePointer();
  }
};

MapCursorManager.prototype._updateMousePointer = function () {
  if (this._isAnyClickableLayerBeingFeatureOvered()) {
    this._mapView.setCursor('pointer');
  } else {
    this._mapView.setCursor('auto');
  }
};

MapCursorManager.prototype._markLayerAsFeatureOvered = function (layerModel) {
  this._clickableLayersBeingFeatureOvered[layerModel.cid] = layerModel;
  layerModel.once('change:visible', this._onLayerVisibilityChanged, this);
};

MapCursorManager.prototype._unmarkLayerAsFeatureOvered = function (layerModel) {
  delete this._clickableLayersBeingFeatureOvered[layerModel.cid];
  layerModel.off('change:visible', this._onLayerVisibilityChanged, this);
};

MapCursorManager.prototype._isLayerClickable = function (layerModel) {
  return this._mapModel.isFeatureInteractivityEnabled() ||
    this._mapModel.arePopupsEnabled() && layerModel.isInfowindowEnabled();
};

MapCursorManager.prototype._isLayerBeingFeatureOvered = function (layerModel) {
  return this._clickableLayersBeingFeatureOvered[layerModel.cid];
};

MapCursorManager.prototype._isAnyClickableLayerBeingFeatureOvered = function () {
  return !_.isEmpty(this._clickableLayersBeingFeatureOvered);
};

module.exports = MapCursorManager;
