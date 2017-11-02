var _ = require('underscore');
var DataviewBase = require('./base');
var constants = require('../constants');
var FormulaDataviewModel = require('../../../dataviews/formula-dataview-model');

/**
 * Formula dataview
 */
function DataviewFormula (source, options) {
  this._initialize(options);

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

DataviewFormula.prototype._defaultParams = function (params) {
  params = params || {};
  params.operation = params.operation || constants.OPERATION.COUNT;
};

DataviewFormula.prototype._checkParams = function (params) {
  if (!_.isUndefined(params) && !_.isUndefined(params.operation) && !constants.isValidOperation(params.operation)) {
    throw new TypeError('Operation param for formula dataview is not valid. Supported values: ' + constants.validOperations());
  }
};

DataviewFormula.prototype._createInternalModel = function (engine) {
  this._internalModel = new FormulaDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    operation: this._params.operation,
    sync_on_data_change: true,
    sync_on_bbox_change: false,
    enabled: this._enabled
  }, {
    engine: engine
  });
};

module.exports = DataviewFormula;
