var HistogramGeoJSONDataProvider = require('./histogram-geojson-data-provider');
var CategoryGeoJSONDataProvider = require('./category-geojson-data-provider');
var FormulaGeoJSONDataProvider = require('./formula-geojson-data-provider');
var ListGeoJSONDataProvider = require('./list-geojson-data-provider');

var GeoJSONDataProvider = function (vectorLayerView, layerIndex) {
  this._vectorLayerView = vectorLayerView;
  this._layerIndex = layerIndex;
};

GeoJSONDataProvider.prototype._dataProviderMap = {
  'histogram': HistogramGeoJSONDataProvider,
  'category': CategoryGeoJSONDataProvider,
  'formula': FormulaGeoJSONDataProvider,
  'list': ListGeoJSONDataProvider
};

GeoJSONDataProvider.prototype.createDataProviderForDataview = function (dataview) {
  var options = {
    dataview: dataview,
    vectorLayerView: this._vectorLayerView,
    layerIndex: this._layerIndex
  };
  var DataProviderClass = this._dataProviderMap[dataview.get('type')];
  if (DataProviderClass) {
    return new DataProviderClass(options);
  }

  throw new Error("Couldn't create data provider for dataview of type " + dataview.get('type'));
};

module.exports = GeoJSONDataProvider;
