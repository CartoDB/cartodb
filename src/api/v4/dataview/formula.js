var _ = require('underscore');
var DataviewBase = require('./base');
var AGGREGATIONS = require('./constants').AGGREGATIONS;
var FormulaDataviewModel = require('../../../dataviews/formula-dataview-model');

/**
 * Formula dataview
 */
function DataviewFormula (source, options) {
  this._initialize(options);
  this._params.operation = options.params.operation || AGGREGATIONS.COUNT;

  this._source = source; // TODO: check that it's based on a right module
}

DataviewFormula.prototype = Object.create(DataviewBase.prototype);

DataviewFormula.prototype.setParams = function (params) {
  this._checkParams(params);
  this._params = params;
  if (this._internalModel) {
    this._internalModel.set('operation', this._params.operation);
  }
  return this;
};

DataviewFormula.prototype._checkParams = function (params) {
  if (!_.isUndefined(params) && !_.isUndefined(params.operation) && !AGGREGATIONS.isValidAggregation(params.operation)) {
    throw new TypeError('Operation param for formula dataview is not valid. Supported values: ' + AGGREGATIONS.validValues());
  }
};

DataviewFormula.prototype.$setEngine = function (engine) {
  this._source.$setEngine(engine);
  this._internalModel = new FormulaDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    operation: this._params.operation,
    sync_on_bbox_change: false,
    enabled: this._enabled
  }, {
    engine: engine
  });
};

module.exports = DataviewFormula;
