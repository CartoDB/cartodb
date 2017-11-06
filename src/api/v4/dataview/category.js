var _ = require('underscore');
var Base = require('./base');
var constants = require('../constants');
var CategoryDataviewModel = require('../../../dataviews/category-dataview-model');

/**
 * Category dataview object
 *
 * @param {carto.source.Base} source - The source where the datavew will fetch the data.
 * @param {string} column - The column name to get the data.
 * @param {object} options
 * @param {carto.operation} options.operation - The operation to apply to the data.
 * @param {string} options.aggregationColumn - The column name to aggretate
 *
 * @constructor
 * @extends carto.dataview.Base
 * @memberof carto.dataview
 * @api
 */
function Category (source, column, options) {
  this._initialize(source, column, options);
}

Category.prototype = Object.create(Base.prototype);

/**
 * Set the dataview operation
 *
 * @param  {carto.operation} operation
 * @return {carto.dataview.Category} this
 * @api
 */
Category.prototype.setOperation = function (operation) {
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
Category.prototype.getOperation = function () {
  return this._options.operation;
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
     * @property {string} type - Constant 'category'
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
      operation: this._options.operation,
      result: result,
      type: 'category'
    };
  }
  return null;
};

/**
 * Set the dataview aggregationColumn
 *
 * @param  {string} aggregationColumn
 * @return {carto.dataview.Category} this
 * @api
 */
Category.prototype.setAggregationColumn = function (aggregationColumn) {
  this._checkAggretationColumn(aggregationColumn);
  this._options.aggregationColumn = aggregationColumn;
  if (this._internalModel) {
    this._internalModel.set('aggregation_column', aggregationColumn);
  }
  return this;
};

/**
 * Return the current dataview aggregationColumn
 *
 * @return {string} Current dataview aggregationColumn
 * @api
 */
Category.prototype.getAggregationColumn = function () {
  return this._options.aggregationColumn;
};

Category.prototype.DEFAULTS = {
  operation: constants.operation.COUNT,
  aggregationColumn: ''
};

Category.prototype._listenToInternalModelSpecificEvents = function () {
  this.listenTo(this._internalModel, 'change:aggregation', this._onOperationChanged);
  this.listenTo(this._internalModel, 'change:aggregation_column', this._onAggretationColumnChanged);
};

Category.prototype._onOperationChanged = function () {
  this.trigger('operationChanged', this._options.operation);
};

Category.prototype._onOperationChanged = function () {
  this.trigger('aggretationColumnChanged', this._options.aggregationColumn);
};

Category.prototype._checkOptions = function (options) {
  if (_.isUndefined(options)) {
    throw new TypeError('Operation option for category dataview is not valid. Use carto.operation');
  }
  this._checkOperation(options.operation);
  this._checkAggretationColumn(options.aggregationColumn);
};

Category.prototype._checkOperation = function (operation) {
  if (_.isUndefined(operation) || !constants.isValidOperation(operation)) {
    throw new TypeError('Operation for category dataview is not valid. Use carto.operation');
  }
};

Category.prototype._checkAggretationColumn = function (aggregationColumn) {
  if (_.isUndefined(aggregationColumn)) {
    throw new TypeError('Aggregation column property is required.');
  }
  if (!_.isString(aggregationColumn)) {
    throw new TypeError('Aggregation column property must be a string.');
  }
  if (_.isEmpty(aggregationColumn)) {
    throw new TypeError('Aggregation column property must be not empty.');
  }
};

Category.prototype._createInternalModel = function (engine) {
  this._internalModel = new CategoryDataviewModel({
    source: this._source.$getInternalModel(),
    column: this._column,
    aggregation: this._options.operation,
    aggratation_column: this._options.aggregationColumn,
    sync_on_data_change: true,
    sync_on_bbox_change: false,
    enabled: this._enabled
  }, {
    engine: engine
  });
};

module.exports = Category;
