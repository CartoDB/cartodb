var _ = require('underscore');
var Backbone = require('backbone');
var DataviewDataProviderFactory = require('./dataview-data-provider-factory');

var GeoJSONDataProvider = function (layerView, layerIndex) {
  this._vectorLayerView = layerView;
  this._layerIndex = layerIndex;
  this._dataProviderFactory = new DataviewDataProviderFactory(layerView, layerIndex);

  this._vectorLayerView._on('featuresChanged', function () {
    this.trigger('dataChanged');
  }.bind(this));
};

GeoJSONDataProvider.prototype.canProvideDataFor = function (dataview) {
  return dataview.hasSameSourceAsLayer();
};

GeoJSONDataProvider.prototype.getDataFor = function (dataview) {
  if (!this.canProvideDataFor(dataview)) {
    throw new Error("Data provider couldn't get data for dataview");
  }

  var dataviewDataProvider = this._createDataProviderForDataview(dataview);
  return dataviewDataProvider.getData();
};

GeoJSONDataProvider.prototype.canApplyFilterTo = function (dataview) {
  return dataview.hasSameSourceAsLayer();
};

GeoJSONDataProvider.prototype.applyFilter = function (dataview, filter) {
  if (!this.canApplyFilterTo(dataview)) {
    throw new Error("Data provider couldn't apply filter to dataview");
  }

  var dataviewDataProvider = this._createDataProviderForDataview(dataview);
  return dataviewDataProvider.applyFilter(filter);
};

GeoJSONDataProvider.prototype._createDataProviderForDataview = function (dataview) {
  return this._dataProviderFactory.createDataProviderForDataview(dataview);
};

_.extend(GeoJSONDataProvider.prototype, Backbone.Events);

module.exports = GeoJSONDataProvider;
