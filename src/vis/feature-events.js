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
  deps = deps || {};
  if (!deps.mapView) throw new Error('mapView is required');
  if (!deps.layersCollection) throw new Error('layersCollection is required');

  this._mapView = deps.mapView;
  this._layersCollection = deps.layersCollection;

  this._layersCollection.on('add', this._setLayerView, this);
  this._layersCollection.on('reset', this._setLayerView, this);
  this._setLayerView();
};

CartoDBFeatureEvents.prototype = Object.create(Backbone.Events);
CartoDBFeatureEvents.prototype.constructor = CartoDBFeatureEvents;

CartoDBFeatureEvents.prototype._setLayerView = function () {
  if (this._layerView) {
    this._unbindCartoDBFeatureEvents();
    delete this._layerView;
  }

  var cartoDBLayers = this._layersCollection.getCartoDBLayers();
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
  var layerModel = this._getCartoDBLayerByLayerIndex(layerIndex);
  if (layerModel) {
    this.trigger('featureOver', {
      layer: layerModel,
      latlng: latlng,
      position: position,
      feature: data
    });
  }
};

CartoDBFeatureEvents.prototype._onFeatureClick = function (event, latlng, position, data, layerIndex) {
  var layerModel = this._getCartoDBLayerByLayerIndex(layerIndex);
  if (layerModel) {
    this.trigger('featureClick', {
      layer: layerModel,
      latlng: latlng,
      position: position,
      feature: data
    });
  }
};

CartoDBFeatureEvents.prototype._onFeatureOut = function (something, layerIndex) {
  var layerModel = this._getCartoDBLayerByLayerIndex(layerIndex);
  if (layerModel) {
    this.trigger('featureOut', {
      layer: layerModel
    });
  }
};

CartoDBFeatureEvents.prototype._getCartoDBLayerByLayerIndex = function (layerIndex) {
  return this._layersCollection.getCartoDBLayers()[layerIndex];
};

module.exports = CartoDBFeatureEvents;
