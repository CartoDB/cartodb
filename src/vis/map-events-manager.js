/**
 * Listens to feature events and "forwards" them to the map model
 * when map's feature interactivity is enabled.
 * @param {Object} deps Dependencies
 */
var MapModelEventsManager = function (deps) {
  if (!deps.mapModel) throw new Error('mapModel is required');

  this._mapModel = deps.mapModel;
};

MapModelEventsManager.prototype.start = function (cartoDBLayerGroupView) {
  this._cartoDBLayerGroupView = cartoDBLayerGroupView;
  this._cartoDBLayerGroupView.on('featureOver', this._onFeatureOver, this);
  this._cartoDBLayerGroupView.on('featureClick', this._onFeatureClick, this);
  this._cartoDBLayerGroupView.on('featureOut', this._onFeatureOut, this);
};

MapModelEventsManager.prototype.stop = function () {
  if (this._cartoDBLayerGroupView) {
    this._cartoDBLayerGroupView.off('featureOver', this._onFeatureOver, this);
    this._cartoDBLayerGroupView.off('featureClick', this._onFeatureClick, this);
    this._cartoDBLayerGroupView.off('featureOut', this._onFeatureOut, this);
    delete this._cartoDBLayerGroupView;
  }
};

MapModelEventsManager.prototype._onFeatureOver = function (event) {
  if (this._mapModel.isFeatureInteractivityEnabled()) {
    this._mapModel.trigger('featureOver', event);
  }
};

MapModelEventsManager.prototype._onFeatureClick = function (event) {
  if (this._mapModel.isFeatureInteractivityEnabled()) {
    this._mapModel.trigger('featureClick', event);
  }
};

MapModelEventsManager.prototype._onFeatureOver = function (event) {
  if (this._mapModel.isFeatureInteractivityEnabled()) {
    this._mapModel.trigger('featureOver', event);
  }
};

module.exports = MapModelEventsManager;
