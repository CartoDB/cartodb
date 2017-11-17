var _ = require('underscore');
var Base = require('./base');
var constants = require('../constants');
var FormulaDataviewModel = require('../../../dataviews/formula-dataview-model');

/**
 * A formula is a simple numeric operation applied to a column in a dataset.
 * 
 * Like all dataviews is an async object so you must wait for the data to be availiable.
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data
 * @param {string} column - The column name to get the data
 * @param {object} options
 * @param {carto.operation} options.operation - The operation to apply to the data
 * 
 * @fires carto.dataview.Formula.dataChanged
 * @fires carto.dataview.Formula.operationChanged
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
 * // You can listen to multiple events emmited by the formula-dataview.
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
 * @fires carto.dataview.Formula.operationChanged
 * @return {carto.dataview.Formula} this
 * @api
 */
Formula.prototype.setOperation = function (operation) {
  this._checkOperation(operation);
  this._operation = operation;
  if (this._internalModel) {
    this._internalModel.set('operation', operation);
  }
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
    /**
     * @typedef {object} carto.dataview.FormulaData
     * @property {number} nulls - Number of null categories
     * @property {string} operation - Operation used
     * @property {number} result - Result of the operation
     * @api
     */
    return {
      nulls: this._internalModel.get('nulls'),
      operation: this._operation,
      result: this._internalModel.get('data')
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
    this._operation = this._internalModel.get('operation');
  }
  this.trigger('operationChanged', this._operation);
};

Formula.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw new TypeError('Formula dataview options are not defined.');
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
    operation: this._operation,
    sync_on_data_change: true,
    sync_on_bbox_change: !!this._boundingBoxFilter,
    enabled: this._enabled
  }, {
    engine: engine,
    bboxFilter: this._boundingBoxFilter && this._boundingBoxFilter.$getInternalModel()
  });
};

module.exports = Formula;

/**
 * Event triggered when the data in a formula-dataview changes.
 *
 * Contains a single argument with the new data.
 * 
 * @event carto.dataview.Formula.dataChanged
 * @type {carto.dataview.FormulaData}
 * @api
 */ 

/**
 * Event triggered when the operation in a formula-dataview changes.
 *
 * Contains a single argument with new operation.
 * 
 * @event carto.dataview.Formula.operationChanged
 * @type {carto.operation}
 * @api
 */ 
