var HistogramDataviewDataProvider = require('./histogram-dataview-data-provider');
var CategoryDataviewDataProvider = require('./category-dataview-data-provider');
var FormulaDataviewDataProvider = require('./formula-dataview-data-provider');
var ListDataviewDataProvider = require('./list-dataview-data-provider');

var DataviewDataProviderFactory = function (layerView, layerIndex) {
  this._vectorLayerView = layerView;
  this._layerIndex = layerIndex;
};

DataviewDataProviderFactory.prototype._dataProviderMap = {
  'histogram': HistogramDataviewDataProvider,
  'category': CategoryDataviewDataProvider,
  'formula': FormulaDataviewDataProvider,
  'list': ListDataviewDataProvider
};

DataviewDataProviderFactory.prototype.createDataProviderForDataview = function (dataview) {
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

module.exports = DataviewDataProviderFactory;
