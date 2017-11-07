var _ = require('underscore');
var Base = require('./base');
var constants = require('../constants');
var FormulaDataviewModel = require('../../../dataviews/formula-dataview-model');

/**
 * Formula dataview object
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data.
 * @param {string} column - The column name to get the data.
 * @param {object} options
 * @param {carto.operation} options.operation - The operation to apply to the data.
 *
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
 */
function Formula (source, column, options) {
  this._initialize(source, column, options);
}

Formula.prototype = Object.create(Base.prototype);

/**
 * Set the dataview operation
 *
 * @param  {carto.operation} operation
 * @return {carto.dataview.Formula} this
 * @api
 */
Formula.prototype.setOperation = function (operation) {
  this._checkOperation(operation);
  this._options.operation = operation;
  if (this._internalModel) {
    this._internalModel.set('operation', operation);
  }
  return this;
};

/**
 * Return the current dataview operation
 *
 * @return {carto.operation} Current dataview operation
 * @api
 */
Formula.prototype.getOperation = function () {
  return this._options.operation;
};

/**
 * Return the resulting data
 *
 * @return {FormulaData}
 * @api
 */
Formula.prototype.getData = function () {
  if (this._internalModel) {
    /**
     * @typedef {object} FormulaData
     * @property {number} nulls
     * @property {string} operation
     * @property {number} result
     * @property {string} type - Constant 'formula'
     * @api
     */
    return {
      operation: this._options.operation,
      result: this._internalModel.get('data'),
      nulls: this._internalModel.get('nulls'),
      type: 'formula'
    };
  }
  return null;
};

Formula.prototype.DEFAULTS = {
  operation: constants.operation.COUNT
};

Formula.prototype._listenToInternalModelSpecificEvents = function () {
  this.listenTo(this._internalModel, 'change:operation', this._onOperationChanged);
};

Formula.prototype._onOperationChanged = function () {
  if (this._internalModel) {
    this._options.operation = this._internalModel.get('operation');
  }
  this.trigger('operationChanged', this._options.operation);
};

Formula.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw new TypeError('Operation option for formula dataview is not valid. Use carto.operation');
  }
  this._checkOperation(options.operation);
};

Formula.prototype._checkOperation = function (operation) {
  if (_.isUndefined(operation) || !constants.isValidOperation(operation)) {
    throw new TypeError('Operation for formula dataview is not valid. Use carto.operation');
  }
};

Formula.prototype._createInternalModel = function (engine) {
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

module.exports = Formula;
