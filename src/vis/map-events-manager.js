/**
 * Listens to feature events and "forwards" them to the map model
 * when map's feature interactivity is enabled.
 * @param {Object} deps Dependencies
 */
var MapModelEventsManager = function (deps) {
  if (!deps.mapModel) throw new Error('mapModel is required');
  if (!deps.featureEvents) throw new Error('featureEvents is required');

  this._mapModel = deps.mapModel;
  this._featureEvents = deps.featureEvents;

  this._featureEvents.on('featureOver', this._onFeatureOver, this);
  this._featureEvents.on('featureClick', this._onFeatureClick, this);
  this._featureEvents.on('featureOut', this._onFeatureOut, this);
};

MapModelEventsManager.prototype._onFeatureClick = function (featureEvent) {
  if (this._mapModel.isFeatureInteractivityEnabled()) {
    this._mapModel.trigger('featureClick', featureEvent);
  }
};

MapModelEventsManager.prototype._onFeatureOver = function (featureEvent) {
  if (this._mapModel.isFeatureInteractivityEnabled()) {
    this._mapModel.trigger('featureOver', featureEvent);
  }
};

module.exports = MapModelEventsManager;
