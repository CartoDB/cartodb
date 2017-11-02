var DataviewBase = require('./dataview-base');
var AGGREGATIONS = require('./constants').AGGREGATIONS;
var FormulaDataviewModel = require('../../../dataviews/formula-dataview-model');

/**
 * Formula dataview
 */
function Formula (source, options) {
  this._checkColumnInOptions(options);
  this._params = options.params;
  this._params.operation = options.params.operation || AGGREGATIONS.COUNT;
  this._checkParams(this._params);

  this._source = source; // TODO: check that it's based on a right module
}

Formula.prototype = Object.create(DataviewBase.prototype);

Formula.prototype._checkParams = function (params) {
  if (!AGGREGATIONS.isValidAggregation(params.operation)) {
    throw new TypeError('Operation param for formula dataview is not valid. Supported values: ' + AGGREGATIONS.validValues());
  }
};

Formula.prototype.$setEngine = function (engine) {
  this._source.$setEngine(engine);
  this._internalModel = new FormulaDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._params.column,
    operation: this._params.operation,
    sync_on_bbox_change: false
  }, {
    engine: engine
  });
};

Formula.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = Formula;
