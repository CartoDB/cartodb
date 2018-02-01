var _ = require('underscore');
var Base = require('../base');
var constants = require('../../constants');
var FormulaDataviewModel = require('../../../../dataviews/formula-dataview-model');
var parseFormulaData = require('./parse-data.js');

/**
 * A formula is a simple numeric {@link carto.operation|operation} applied to the column of a {@link carto.source.Base|data source} (dataset or sql query).
 *
 * Like all dataviews, it is an async object so you must wait for the data to be available.
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data from
 * @param {string} column - The operation will be performed using this column
 * @param {object} [options]
 * @param {carto.operation} [options.operation] - The operation to apply to the data
 *
 * @fires dataChanged
 * @fires columnChanged
 * @fires statusChanged
 * @fires error
 *
 * @fires operationChanged
 *
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
 * @example
 * // Given a cities dataset get the most populated city
 * var formulaDataview = new carto.dataview.Formula(citiesSource, 'population', {
 *  operation: carto.operation.MAX,
 * });
 * @example
 * // You can listen to multiple events emitted by a formula dataview.
 * // Data and status are fired by all dataviews.
 * formulaDataview.on('dataChanged', newData => { });
 * formulaDataview.on('statusChanged', (newData, error) => { });
 * formulaDataview.on('error', cartoError => { });
 *
 * // Listen to specific formula-dataview events
 * formulaDataview.on('columnChanged', newData => { });
 * formulaDataview.on('operationChanged', newData => { });
 */
function Formula (source, column, options) {
  this._initialize(source, column, options);
  this._operation = this._options.operation;
}

Formula.prototype = Object.create(Base.prototype);

/**
 * Set the dataview operation.
 *
 * @param  {carto.operation} operation
 * @fires operationChanged
 * @return {carto.dataview.Formula} this
 * @api
 */
Formula.prototype.setOperation = function (operation) {
  this._checkOperation(operation);
  this._changeProperty('operation', operation);
  return this;
};

/**
 * Return the current dataview operation.
 *
 * @return {carto.operation} Current dataview operation
 * @api
 */
Formula.prototype.getOperation = function () {
  return this._operation;
};

/**
 * Return the resulting data.
 *
 * @return {carto.dataview.FormulaData}
 * @api
 */
Formula.prototype.getData = function () {
  if (this._internalModel) {
    return parseFormulaData(
      this._internalModel.get('nulls'),
      this._operation,
      this._internalModel.get('data')
    );
  }
  return null;
};

Formula.prototype.DEFAULTS = {
  operation: constants.operation.COUNT
};

Formula.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw this._getValidationError('formulaOptionsRequired');
  }
  this._checkOperation(options.operation);
};

Formula.prototype._checkOperation = function (operation) {
  if (_.isUndefined(operation) || !constants.isValidOperation(operation)) {
    throw this._getValidationError('formulaInvalidOperation');
  }
};

Formula.prototype._createInternalModel = function (engine) {
  this._internalModel = new FormulaDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    operation: this._operation,
    sync_on_bbox_change: !!this._boundingBoxFilter,
    enabled: this._enabled
  }, {
    engine: engine,
    bboxFilter: this._boundingBoxFilter && this._boundingBoxFilter.$getInternalModel()
  });
};

module.exports = Formula;

/**
 * Fired when the operation has changed. Handler gets a parameter with the new operation.
 *
 * @event operationChanged
 * @type {carto.operation}
 * @api
 */
