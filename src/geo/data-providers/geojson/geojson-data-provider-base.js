var _ = require('underscore');
var Backbone = require('backbone');

var GeoJSONDataProviderBase = function (options) {
  this._dataview = options.dataview;
  this._vectorLayerView = options.vectorLayerView;
  this._layerIndex = options.layerIndex;

  this._vectorLayerView._on('featuresChanged', function () {
    this.trigger('dataChanged', this.getData());
  }.bind(this));
};

GeoJSONDataProviderBase.prototype.getData = function () {
  throw new Error('Subclasses of GeoJSONDataProviderBase must implement .getData');
};

GeoJSONDataProviderBase.prototype.applyFilter = function () {};

GeoJSONDataProviderBase.prototype._getFeatures = function () {
  return this._vectorLayerView.getFeatures()[this._layerIndex];
};

_.extend(GeoJSONDataProviderBase.prototype, Backbone.Events);

module.exports = GeoJSONDataProviderBase;
