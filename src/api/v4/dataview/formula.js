var _ = require('underscore');
var DataviewBase = require('./base');
var constants = require('../constants');
var FormulaDataviewModel = require('../../../dataviews/formula-dataview-model');

/**
 * Formula dataview
 */
function DataviewFormula (source, column, options) {
  this._initialize(source, column, options);
}

DataviewFormula.prototype = Object.create(DataviewBase.prototype);

DataviewFormula.prototype.setOperation = function (operation) {
  this._checkOperation(operation);
  this._options.operation = operation;
  if (this._internalModel) {
    this._internalModel.set('operation', operation);
  }
  return this;
};

DataviewFormula.prototype.getOperation = function () {
  return this._options.operation;
};

DataviewFormula.prototype.getData = function () {
  if (this._internalModel) {
    return {
      operation: this._options.operation,
      result: this._internalModel.get('data'),
      nulls: this._internalModel.get('nulls'),
      type: 'formula'
    };
  }
  return null;
};

DataviewFormula.prototype._defaultOptions = function (options) {
  options = options || {};
  options.operation = options.operation || constants.OPERATION.COUNT;
  return options;
};

DataviewFormula.prototype._listenToInstanceModelEvents = function () {
  this.listenTo(this._internalModel, 'change:operation', this._onOperationChanged);
};

DataviewFormula.prototype._onOperationChanged = function () {
  this.trigger('operationChanged', this._options.operation);
};

DataviewFormula.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw new TypeError('Operation option for formula dataview is not valid. Use carto.operation');
  }
  this._checkOperation(options.operation);
};

DataviewFormula.prototype._checkOperation = function (operation) {
  if (_.isUndefined(operation) || !constants.isValidOperation(operation)) {
    throw new TypeError('Operation for formula dataview is not valid. Use carto.operation');
  }
};

DataviewFormula.prototype._createInternalModel = function (engine) {
  this._internalModel = new FormulaDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    operation: this._options.operation,
    sync_on_data_change: true,
    sync_on_bbox_change: false,
    enabled: this._enabled
  }, {
    engine: engine
  });
};

module.exports = DataviewFormula;
