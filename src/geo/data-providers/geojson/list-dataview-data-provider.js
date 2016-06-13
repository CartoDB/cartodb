var _ = require('underscore');
var DataviewDataProviderBase = require('./dataview-data-provider-base');

var ListDataviewDataProvider = function (vectorLayerView, layerIndex) {
  DataviewDataProviderBase.apply(this, arguments);
};

_.extend(ListDataviewDataProvider.prototype, DataviewDataProviderBase.prototype);

ListDataviewDataProvider.prototype.getData = function () {};

ListDataviewDataProvider.prototype.applyFilter = function (filter) {};

module.exports = ListDataviewDataProvider;
