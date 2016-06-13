var DataviewDataProviderBase = function (options) {
  this._dataview = options.dataview;
  this._vectorLayerView = options.vectorLayerView;
  this._layerIndex = options.layerIndex;
};

DataviewDataProviderBase.prototype.getData = function () {
  throw new Error('Subclasses of DataviewDataProviderBase must implement .getData');
};

DataviewDataProviderBase.prototype.applyFilter = function () {
  throw new Error('Subclasses of DataviewDataProviderBase must implement .applyFilter');
};

module.exports = DataviewDataProviderBase;
