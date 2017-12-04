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
 * ```sql
 * SELECT country, AVG(population) GROUP BY country
 * ```
 * The following code is the carto.js equivalent:
 *
 * ```javascript
 * var categoryDataview = new carto.dataview.Category(citiesSource, 'country', {
 *     operation: carto.operation.AVG, // Compute the average
 *     operationColumn: 'population' // The name of the column where the operation will be applied.
 *  });
 * ```
 *
 * Like all dataviews is an async object so you must wait for the data to be availiable.
 *
 * The data format for the category-dataview is described in {@link carto.dataview.CategoryItem}
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data
 * @param {string} column - The name of the column used to create categories
 * @param {object} [options]
 * @param {number} [options.limit=6] - The maximum number of categories in the response
 * @param {carto.operation} [options.operation] - The operation to apply to the data
 * @param {string} [options.operationColumn] - The column where the operation will be applied
 *
 * @fires carto.dataview.Category.dataChanged
 * @fires carto.dataview.Category.limitChanged
 * @fires carto.dataview.Category.operationChanged
 * @fires carto.dataview.Category.operationColumnChanged
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
 *
 * // This will give data like this: { Spain: 1234, France: 3456 ...} To view the actual format see: "CategoryItem".
 * @example
 * // You can listen to multiple events emmited by the category-dataview.
 * // Data and status are fired by all dataviews.
 * categoryDataview.on('dataChanged', newData => { });
 * categoryDataview.on('statusChanged', (newData, error) => { });
 * categoryDataview.on('error', cartoError => { });
 *
 * // Listen to specific category-dataview events.
 * categoryDataview.on('columnChanged', newData => { });
 * categoryDataview.on('limitChanged', newData => { });
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
 * @fires carto.dataview.Category.limitChanged
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
 * @fires carto.dataview.Category.operationChanged
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
 * @fires carto.dataview.Category.operationColumnChanged
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
    throw new TypeError('Category dataview options are not defined.');
  }
  this._checkLimit(options.limit);
  this._checkOperation(options.operation);
  this._checkOperationColumn(options.operationColumn);
};

Category.prototype._checkLimit = function (limit) {
  if (_.isUndefined(limit)) {
    throw new TypeError('Limit for category dataview is required.');
  }
  if (!_.isNumber(limit)) {
    throw new TypeError('Limit for category dataview must be a number.');
  }
  if (limit <= 0) {
    throw new TypeError('Limit for category dataview must be greater than 0.');
  }
};

Category.prototype._checkOperation = function (operation) {
  if (_.isUndefined(operation) || !constants.isValidOperation(operation)) {
    throw new TypeError('Operation for category dataview is not valid. Use carto.operation');
  }
};

Category.prototype._checkOperationColumn = function (operationColumn) {
  if (_.isUndefined(operationColumn)) {
    throw new TypeError('Operation column for category dataview is required.');
  }
  if (!_.isString(operationColumn)) {
    throw new TypeError('Operation column for category dataview must be a string.');
  }
  if (_.isEmpty(operationColumn)) {
    throw new TypeError('Operation column for category dataview must be not empty.');
  }
};

Category.prototype._createInternalModel = function (engine) {
  this._internalModel = new CategoryDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    aggregation: this._operation,
    aggregation_column: this._operationColumn,
    categories: this._limit,
    sync_on_data_change: true,
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
 * Event triggered when the data in a category-dataview changes.
 *
 * Contains a single argument with the {@link carto.dataview.CategoryData}
 *
 * @event carto.dataview.Category.dataChanged
 * @type {carto.dataview.CategoryData}
 * @api
 */

/**
 * Event triggered when the limit in a category-dataview changes.
 *
 * Contains a single argument with the new limit.
 *
 * @event carto.dataview.Category.limitChanged
 * @type {number}
 * @api
 */

/**
 * Event triggered when the operation in a category-dataview changes.
 *
 * Contains a single argument with the new operation name.
 *
 * @event carto.dataview.Category.operationChanged
 * @type {string}
 * @api
 */

/**
 * Event triggered when the operationColumn in a category-dataview changes.
 *
 * Contains a single argument with the new operationColumn name.
 *
 * @event carto.dataview.Category.operationColumnChanged
 * @type {string}
 * @api
 */
