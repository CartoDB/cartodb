var _ = require('underscore');
var GeoJSONDataProviderBase = require('./geojson-data-provider-base');

var ListGeoJSONDataProvider = function (vectorLayerView, layerIndex) {
  GeoJSONDataProviderBase.apply(this, arguments);
};

_.extend(ListGeoJSONDataProvider.prototype, GeoJSONDataProviderBase.prototype);

ListGeoJSONDataProvider.prototype.getData = function (features) {
};

ListGeoJSONDataProvider.prototype.applyFilter = function (filter) {
};

module.exports = ListGeoJSONDataProvider;
