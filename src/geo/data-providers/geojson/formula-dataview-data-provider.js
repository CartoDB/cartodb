var _ = require('underscore');
var DataviewDataProviderBase = require('./dataview-data-provider-base');

var FormulaDataviewDataProvider = function (vectorLayerView, layerIndex) {
  DataviewDataProviderBase.apply(this, arguments);
};

_.extend(FormulaDataviewDataProvider.prototype, DataviewDataProviderBase.prototype);

FormulaDataviewDataProvider.prototype.getData = function () {
  var filter = this._vectorLayerView.getFilter(this._layerIndex);
  var options = this._dataview.attributes;
  var features = filter.getValues();
  var operation = options.operation;
  var columnName = options.column;
  var nulls = features.reduce(function (p, c) { return p + (c.properties[columnName] === null ? 1 : 0); }, 0);
  var result;
  if (operation === 'count') {
    result = features.length;
  } else if (operation === 'avg') {
    result = features.reduce(function (p, c) { return p + c.properties[columnName]; }, 0) / features.length;
  } else if (operation === 'sum') {
    result = features.reduce(function (p, c) { return p + c.properties[columnName]; }, 0);
  } else if (operation === 'min') {
    result = features.reduce(function (p, c) { return Math.min(p, c.properties[columnName]); }, Infinity);
  } else if (operation === 'max') {
    result = features.reduce(function (p, c) { return Math.max(p, c.properties[columnName]); }, 0);
  } else {
    throw new Error("Coudn't generate data for formula dataview and '" + operation + "' operation.");
  }
  var data = {
    'operation': operation,
    'result': result,
    'nulls': nulls,
    'type': 'formula'
  };
  return data;
};

FormulaDataviewDataProvider.prototype.applyFilter = function (filter) {};

module.exports = FormulaDataviewDataProvider;
