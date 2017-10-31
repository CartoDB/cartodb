var DataviewBase = require('./dataview-base');
var AGGREGATIONS = require('./constants').AGGREGATIONS;
var FormulaDataviewModel = require('../../../dataviews/formula-dataview-model');

/**
 * Formula dataview
 */
function Formula (node, options) {
  this._checkColumnInOptions(options);
  this._params = options.params;
  this._params.operation = options.params.operation || AGGREGATIONS.COUNT;
  this._checkParams(this._params);

  // Create the internal dataview
  this._dataviewModel = new FormulaDataviewModel();
}
Formula.prototype = Object.create(DataviewBase.prototype);

Formula.prototype._checkParams = function (params) {
  if (!AGGREGATIONS.isValidAggregation(params.operation)) {
    throw new TypeError('Operation param for formula dataview is not valid. Supported values: ' + AGGREGATIONS.validValues());
  }
};

module.exports = Formula;
