var _ = require('underscore');
var Base = require('./base');
var constants = require('../constants');
var CategoryDataviewModel = require('../../../dataviews/category-dataview-model');
var CategoryFilter = require('../../../windshaft/filters/category');

/**
 * Category dataview object
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data.
 * @param {string} column - The column name to get the data.
 * @param {object} options
 * @param {number} [options.limit=6] - The maximum number of categories in the response.
 * @param {carto.operation} options.operation - The operation to apply to the data.
 * @param {string} options.operationColumn - The column name used in the operation.
 *
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
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
 * Set the categories limit
 *
 * @param  {number} limit
 * @return {carto.dataview.Category} this
 * @api
 */
Category.prototype.setLimit = function (limit) {
  this._checkLimit(limit);
  this._limit = limit;
  if (this._internalModel) {
    this._internalModel.set('categories', limit);
  }
  return this;
};

/**
 * Return the current categories limit
 *
 * @return {number} Current dataview limit
 * @api
 */
Category.prototype.getLimit = function () {
  return this._limit;
};

/**
 * Set the dataview operation
 *
 * @param  {carto.operation} operation
 * @return {carto.dataview.Category} this
 * @api
 */
Category.prototype.setOperation = function (operation) {
  this._checkOperation(operation);
  this._operation = operation;
  if (this._internalModel) {
    this._internalModel.set('aggregation', operation);
  }
  return this;
};

/**
 * Return the current dataview operation
 *
 * @return {carto.operation} Current dataview operation
 * @api
 */
Category.prototype.getOperation = function () {
  return this._operation;
};

/**
 * Set the dataview operationColumn
 *
 * @param  {string} operationColumn
 * @return {carto.dataview.Category} this
 * @api
 */
Category.prototype.setOperationColumn = function (operationColumn) {
  this._checkOperationColumn(operationColumn);
  this._operationColumn = operationColumn;
  if (this._internalModel) {
    this._internalModel.set('aggregation_column', operationColumn);
  }
  return this;
};

/**
 * Return the current dataview operationColumn
 *
 * @return {string} Current dataview operationColumn
 * @api
 */
Category.prototype.getOperationColumn = function () {
  return this._operationColumn;
};

/**
 * Return the resulting data
 *
 * @return {CategoryData}
 * @api
 */
Category.prototype.getData = function () {
  if (this._internalModel) {
    /**
     * @typedef {object} CategoryItem
     * @property {boolean} group
     * @property {string} name
     * @property {number} value
     * @api
     */
    /**
     * @typedef {object} CategoryData
     * @property {number} count
     * @property {number} max
     * @property {number} min
     * @property {number} nulls
     * @property {string} operation
     * @property {CategoryItem[]} result
     * @api
     */
    var data = this._internalModel.get('data');
    var result = _.map(data, function (item) {
      return {
        group: item.agg,
        name: item.name,
        value: item.value
      };
    });
    return {
      count: this._internalModel.get('count'),
      max: this._internalModel.get('max'),
      min: this._internalModel.get('min'),
      nulls: this._internalModel.get('nulls'),
      operation: this._operation,
      result: result
    };
  }
  return null;
};

Category.prototype.DEFAULTS = {
  limit: 6,
  operation: constants.operation.COUNT
};

Category.prototype._listenToInternalModelSpecificEvents = function () {
  this.listenTo(this._internalModel, 'change:categories', this._onLimitChanged);
  this.listenTo(this._internalModel, 'change:aggregation', this._onOperationChanged);
  this.listenTo(this._internalModel, 'change:aggregation_column', this._onOperationColumnChanged);
};

Category.prototype._onLimitChanged = function () {
  if (this._internalModel) {
    this._limit = this._internalModel.get('categories');
  }
  this.trigger('limitChanged', this._limit);
};

Category.prototype._onOperationChanged = function () {
  if (this._internalModel) {
    this._operation = this._internalModel.get('aggregation');
  }
  this.trigger('operationChanged', this._operation);
};

Category.prototype._onOperationColumnChanged = function () {
  if (this._internalModel) {
    this._operationColumn = this._internalModel.get('aggregation_column');
  }
  this.trigger('operationColumnChanged', this._operationColumn);
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

  this._internalModel.on('error', this._triggerError, this);
};

module.exports = Category;
