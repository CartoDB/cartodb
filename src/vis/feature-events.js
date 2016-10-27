var Backbone = require('backbone');

/**
 * Abstraction to make working with feature events easier. This class
 * knows what's the layerView that groups the CartoDB layer and listens
 * to feature event on that layerView, massaging those events to make
 * them more usable (eg: events use an event object which includes the
 * model of the layer whose feature was clicked).
 * @param {Object} deps Dependencies.
 */
var CartoDBFeatureEvents = function (deps) {
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.mapModel) throw new Error('mapModel is required');

  this._mapView = deps.mapView;
  this._mapModel = deps.mapModel;

  this._mapModel.layers.on('add', this._setLayerView, this);
  this._mapModel.layers.on('reset', this._setLayerView, this);
  this._setLayerView();
};

CartoDBFeatureEvents.prototype = Object.create(Backbone.Events);
CartoDBFeatureEvents.prototype.constructor = CartoDBFeatureEvents;

CartoDBFeatureEvents.prototype._setLayerView = function () {
  if (this._layerView) {
    this._unbindCartoDBFeatureEvents();
    delete this._layerView;
  }

  var cartoDBLayers = this._mapModel.layers.getCartoDBLayers();
  if (cartoDBLayers.length > 0) {
    this._layerView = this._mapView.getLayerViewByLayerCid(cartoDBLayers[0].cid);
    this._bindCartoDBFeatureEvents();
  }
};

CartoDBFeatureEvents.prototype._unbindCartoDBFeatureEvents = function () {
  this._layerView.off('featureOver', this._onFeatureOver, this);
  this._layerView.off('featureClick', this._onFeatureClick, this);
  this._layerView.off('featureOut', this._onFeatureOut, this);
};

CartoDBFeatureEvents.prototype._bindCartoDBFeatureEvents = function () {
  this._layerView.on('featureOver', this._onFeatureOver, this);
  this._layerView.on('featureClick', this._onFeatureClick, this);
  this._layerView.on('featureOut', this._onFeatureOut, this);
};

CartoDBFeatureEvents.prototype._onFeatureOver = function (event, latlng, position, data, layerIndex) {
  this._featureOverLayerIndex = layerIndex;
  this._triggerMouseEvent('featureOver', arguments);
};

CartoDBFeatureEvents.prototype._onFeatureClick = function (event, latlng, position, data, layerIndex) {
  this._triggerMouseEvent('featureClick', arguments);
};

CartoDBFeatureEvents.prototype._onFeatureOut = function (something, layerIndex) {
  if (this._featureOverLayerIndex === layerIndex) {
    this.trigger('featureOut', undefined, layerIndex);
    delete this._featureOverLayerIndex;
  }
};

CartoDBFeatureEvents.prototype._triggerMouseEvent = function (eventName, originalEventArguments) {
  var latlng = originalEventArguments[1];
  var position = originalEventArguments[2];
  var featureData = originalEventArguments[3];
  var layerIndex = originalEventArguments[4];

  this.trigger(eventName, {
    layer: this._mapModel.layers.getCartoDBLayers()[layerIndex],
    latlng: latlng,
    position: {
      x: position.x,
      y: position.y
    },
    feature: featureData
  });
};

module.exports = CartoDBFeatureEvents;
