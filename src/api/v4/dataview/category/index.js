var _ = require('underscore');
var Base = require('../base');
var constants = require('../../constants');
var CategoryDataviewModel = require('../../../../dataviews/category-dataview-model');
var CategoryFilter = require('../../../../windshaft/filters/category');
var parseCategoryData = require('./parse-data.js');

/**
 *
 * A category dataview is used to aggregate data performing a operation.
 *
 * This is similar to a group by SQL operation, for example:
 *
 * ```
 * SELECT country, AVG(population) GROUP BY country
 * ```
 * The following code is the CARTO.js equivalent:
 *
 * ```javascript
 * var categoryDataview = new carto.dataview.Category(citiesSource, 'country', {
 *     operation: carto.operation.AVG, // Compute the average
 *     operationColumn: 'population' // The name of the column where the operation will be applied.
 *  });
 * ```
 *
 * Like every other dataview, this is an async object and you must wait for the data to be availiable.
 *
 * The data format for the category-dataview is described in {@link carto.dataview.CategoryData}
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data
 * @param {string} column - The name of the column used to create categories
 * @param {object} [options]
 * @param {number} [options.limit=6] - The maximum number of categories in the response
 * @param {carto.operation} [options.operation] - The operation to apply to the data
 * @param {string} [options.operationColumn] - The column where the operation will be applied
 *
 * @fires dataChanged
 * @fires columnChanged
 * @fires statusChanged
 * @fires error
 *
 * @fires limitChanged
 * @fires operationChanged
 * @fires operationColumnChanged
 *
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
 * @example
 * // From a cities dataset with name, country and population show the average city population per country:
 * var column = 'country'; // Aggregate the data by country.
 * var categoryDataview = new carto.dataview.Category(citiesSource, column, {
 *     operation: carto.operation.AVG, // Compute the average
 *     operationColumn: 'population' // The name of the column where the operation will be applied.
 *  });
 * @example
 * // Listen for data updates
 * categoryDataview.on('dataChanged', newData => {
 *  console.log(newData); // CategoryData object
 * });
 * @example
 * // You can listen to multiple events emmited by the category-dataview.
 * categoryDataview.on('statusChanged', (newData, error) => { });
 * categoryDataview.on('error', cartoError => { });
 *
 * // Listen to specific category-dataview events.
 * categoryDataview.on('columnChanged', newData => {
 *  console.log(newData); // 'population'
 * });
 * categoryDataview.on('limitChanged', newData => {
 *  console.log(newData); // 11
 * });
 * categoryDataview.on('operationChanged', newData => { });
 * categoryDataview.on('operationColumnChanged', newData => { });
 */
function Category (source, column, options) {
  this.DEFAULTS.operationColumn = column;

  this._initialize(source, column, options);
  this._limit = this._options.limit;
  this._operation = this._options.operation;
  this._operationColumn = this._options.operationColumn;
}

Category.prototype = Object.create(Base.prototype);

/**
 * Set the categories limit.
 *
 * @param  {number} limit
 * @fires limitChanged
 * @return {carto.dataview.Category} this
 * @api
 */
Category.prototype.setLimit = function (limit) {
  this._checkLimit(limit);
  this._changeProperty('limit', limit, 'categories');
  return this;
};

/**
 * Return the current categories limit.
 *
 * @return {number} Current dataview limit
 * @api
 */
Category.prototype.getLimit = function () {
  return this._limit;
};

/**
 * Set the dataview operation.
 *
 * @param  {carto.operation} operation
 * @fires operationChanged
 * @return {carto.dataview.Category} this
 * @api
 */
Category.prototype.setOperation = function (operation) {
  this._checkOperation(operation);
  this._changeProperty('operation', operation, 'aggregation');
  return this;
};

/**
 * Return the current dataview operation.
 *
 * @return {carto.operation} Current dataview operation
 * @api
 */
Category.prototype.getOperation = function () {
  return this._operation;
};

/**
 * Set the dataview operationColumn.
 *
 * @param  {string} operationColumn
 * @fires operationColumnChanged
 * @return {carto.dataview.Category} this
 * @api
 */
Category.prototype.setOperationColumn = function (operationColumn) {
  this._checkOperationColumn(operationColumn);
  this._changeProperty('operationColumn', operationColumn, 'aggregation_column');
  return this;
};

/**
 * Return the current dataview operationColumn.
 *
 * @return {string} Current dataview operationColumn
 * @api
 */
Category.prototype.getOperationColumn = function () {
  return this._operationColumn;
};

/**
 * Return the resulting data.
 *
 * @return {carto.dataview.CategoryData}
 * @api
 */
Category.prototype.getData = function () {
  if (this._internalModel) {
    return parseCategoryData(
      this._internalModel.get('data'),
      this._internalModel.get('count'),
      this._internalModel.get('max'),
      this._internalModel.get('min'),
      this._internalModel.get('nulls'),
      this._operation
    );
  }
  return null;
};

Category.prototype.DEFAULTS = {
  limit: 6,
  operation: constants.operation.COUNT
};

Category.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw this._getValidationError('categoryOptionsRequired');
  }
  this._checkLimit(options.limit);
  this._checkOperation(options.operation);
  this._checkOperationColumn(options.operationColumn);
};

Category.prototype._checkLimit = function (limit) {
  if (_.isUndefined(limit)) {
    throw this._getValidationError('categoryLimitRequired');
  }
  if (!_.isNumber(limit)) {
    throw this._getValidationError('categoryLimitNumber');
  }
  if (limit <= 0) {
    throw this._getValidationError('categoryLimitPositive');
  }
};

Category.prototype._checkOperation = function (operation) {
  if (_.isUndefined(operation) || !constants.isValidOperation(operation)) {
    throw this._getValidationError('categoryInvalidOperation');
  }
};

Category.prototype._checkOperationColumn = function (operationColumn) {
  if (_.isUndefined(operationColumn)) {
    throw this._getValidationError('categoryOperationRequired');
  }
  if (!_.isString(operationColumn)) {
    throw this._getValidationError('categoryOperationString');
  }
  if (_.isEmpty(operationColumn)) {
    throw this._getValidationError('categoryOperationEmpty');
  }
};

Category.prototype._createInternalModel = function (engine) {
  this._internalModel = new CategoryDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    aggregation: this._operation,
    aggregation_column: this._operationColumn,
    categories: this._limit,
    sync_on_bbox_change: !!this._boundingBoxFilter,
    enabled: this._enabled
  }, {
    engine: engine,
    filter: new CategoryFilter(),
    bboxFilter: this._boundingBoxFilter && this._boundingBoxFilter.$getInternalModel()
  });
};

module.exports = Category;

/**
 * Fired when limit has changed. Handler gets a parameter with the new limit.
 *
 * @event limitChanged
 * @type {number}
 * @api
 */

/**
 * Fired when operation has changed. Handler gets a parameter with the new limit.
 *
 * @event operationChanged
 * @type {string}
 * @api
 */

/**
 * Fired when operationColumn has changed. Handler gets a parameter with the new operationColumn.
 *
 * @event operationColumnChanged
 * @type {string}
 * @api
 */
