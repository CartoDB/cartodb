var _ = require('underscore');

/**
 * Changes the mouse pointer based on feature events and status
 * of map's interactivity.
 * @param {Object} deps Dependencies
 */
var MapCursorManager = function (deps) {
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.mapModel) throw new Error('mapModel is required');

  this._mapView = deps.mapView;
  this._mapModel = deps.mapModel;

  // Map to keep track of clickable layers that are being feature overed
  this._clickableLayersBeingFeatureOvered = {};
};

MapCursorManager.prototype.start = function (cartoDBLayerGroupView) {
  this._cartoDBLayerGroupView = cartoDBLayerGroupView;
  this._cartoDBLayerGroupView.on('featureOver', this._onFeatureOver, this);
  this._cartoDBLayerGroupView.on('featureOut', this._onFeatureOut, this);
};

MapCursorManager.prototype.stop = function (cartoDBLayerGroupView) {
  if (this._cartoDBLayerGroupView) {
    this._cartoDBLayerGroupView.off('featureOver', this._onFeatureOver, this);
    this._cartoDBLayerGroupView.off('featureOut', this._onFeatureOut, this);
    delete this._cartoDBLayerGroupView;
  }
};

MapCursorManager.prototype._onFeatureOver = function (featureEvent) {
  if (this._isLayerClickable(featureEvent.layer) &&
    !this._isLayerBeingFeatureOvered(featureEvent.layer)) {
    this._markLayerAsFeatureOvered(featureEvent.layer);
    this._updateMousePointer();
  }
};

MapCursorManager.prototype._onFeatureOut = function (featureEvent) {
  if (this._isLayerBeingFeatureOvered(featureEvent.layer)) {
    this._unmarkLayerAsFeatureOvered(featureEvent.layer);
    this._updateMousePointer();
  }
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
  return !!this._clickableLayersBeingFeatureOvered[layerModel.cid];
};

MapCursorManager.prototype._isAnyClickableLayerBeingFeatureOvered = function () {
  return !_.isEmpty(this._clickableLayersBeingFeatureOvered);
};

module.exports = MapCursorManager;
