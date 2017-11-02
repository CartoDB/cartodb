var DataviewBase = require('./base');
var AGGREGATIONS = require('./constants').AGGREGATIONS;
var FormulaDataviewModel = require('../../../dataviews/formula-dataview-model');

/**
 * Formula dataview
 */
function DataviewFormula (source, options) {
  this._checkColumnInOptions(options);
  this._params = options.params;
  this._params.operation = options.params.operation || AGGREGATIONS.COUNT;
  this._checkParams(this._params);

  this._source = source; // TODO: check that it's based on a right module
}

DataviewFormula.prototype = Object.create(DataviewBase.prototype);

DataviewFormula.prototype._checkParams = function (params) {
  if (!AGGREGATIONS.isValidAggregation(params.operation)) {
    throw new TypeError('Operation param for formula dataview is not valid. Supported values: ' + AGGREGATIONS.validValues());
  }
};

DataviewFormula.prototype.$setEngine = function (engine) {
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

DataviewFormula.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = DataviewFormula;
