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
};

MapCursorManager.prototype._onFeatureOver = function () {
  if (this._mapModel.isInteractive()) {
    this._mapView.setCursor('pointer');
  }
};

MapCursorManager.prototype._onFeatureOut = function () {
  this._mapView.setCursor('auto');
};

module.exports = MapCursorManager;
