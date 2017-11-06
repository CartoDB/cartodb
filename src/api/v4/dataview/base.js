var _ = require('underscore');
var Backbone = require('backbone');
var status = require('../constants').status;
var SourceBase = require('../source/base');

/**
 * Base dataview object
 *
 * @constructor
 * @abstract
 * @memberof carto.dataview
 * @api
 */
function Base () {}

_.extend(Base.prototype, Backbone.Events);

/**
 * Return the current dataview status
 *
 * @return {carto.dataview.status} Current dataview status
 * @api
 */
Base.prototype.getStatus = function () {
  return this._status;
};

/**
 * Return true is the current status is loading
 *
 * @return {boolean}
 * @api
 */
Base.prototype.isLoading = function () {
  return this._status === status.LOADING;
};

/**
 * Return true is the current status is loaded
 *
 * @return {boolean}
 * @api
 */
Base.prototype.isLoaded = function () {
  return this._status === status.LOADED;
};

/**
 * Return true is the current status is error
 *
 * @return {boolean}
 * @api
 */
Base.prototype.hasError = function () {
  return this._status === status.ERROR;
};

/**
 * Enable the dataview
 *
 * @return {carto.dataview.Base} this
 * @api
 */
Base.prototype.enable = function () {
  return this._setEnabled(true);
};

/**
 * Disable the dataview
 *
 * @return {carto.dataview.Base} this
 * @api
 */
Base.prototype.disable = function () {
  return this._setEnabled(false);
};

/**
 * Return true if the dataview is enabled
 *
 * @return {boolean}
 * @api
 */
Base.prototype.isEnabled = function () {
  return this._enabled;
};

/**
 * Set the dataview column
 *
 * @param  {string} column
 * @return {carto.dataview.Base} this
 * @api
 */
Base.prototype.setColumn = function (column) {
  this._checkColumn(column);
  this._column = column;
  if (this._internalModel) {
    this._internalModel.set('column', this._column);
  }
  return this;
};

/**
 * Return the current dataview column
 *
 * @return {string} Current dataview column
 * @api
 */
Base.prototype.getColumn = function () {
  return this._column;
};

Base.prototype.getData = function () {
  throw new Error('getData must be implemented by the particular dataview.');
};

// syncOnBoundingChanges
// isSyncedOnBoundingChanges

// Protected methods

/**
 * Initialize dataview
 *
 * @param {carto.source.Base} source - The source where the datavew will fetch the data.
 * @param {string} column - The column name to get the data.
 * @param  {object} options - It depends on the instance.
 */
Base.prototype._initialize = function (source, column, options) {
  options = this._defaultOptions(options);

  this._checkSource(source);
  this._checkColumn(column);
  this._checkOptions(options);

  this._source = source;
  this._column = column;
  this._options = options;
  this._status = status.NOT_LOADED;
  this._enabled = true;
};

Base.prototype._defaultOptions = function (options) {
  throw new Error('_defaultOptions must be implemented by the particular dataview.');
};

Base.prototype._checkSource = function (source) {
  if (!(source instanceof SourceBase)) {
    throw new TypeError('Source property is required.');
  }
};

Base.prototype._checkColumn = function (column) {
  if (_.isUndefined(column)) {
    throw new TypeError('Column property is required.');
  }
  if (!_.isString(column)) {
    throw new TypeError('Column property must be a string.');
  }
  if (_.isEmpty(column)) {
    throw new TypeError('Column property must be not empty.');
  }
};

Base.prototype._checkOptions = function (options) {
  throw new Error('_checkOptions must be implemented by the particular dataview.');
};

Base.prototype._createInternalModel = function (engine) {
  throw new Error('_createInternalModel must be implemented by the particular dataview.');
};

Base.prototype._setEnabled = function (enabled) {
  this._enabled = enabled;
  if (this._internalModel) {
    this._internalModel.set('enabled', enabled);
  }
  return this;
};

Base.prototype._listenToInternalModelEvents = function () {
  if (this._internalModel) {
    this.listenTo(this._internalModel, 'change:data', this._onDataChanged);
    this.listenTo(this._internalModel, 'change:column', this._onColumnChanged);
    this.listenTo(this._internalModel, 'loading', this._onStatusLoading);
    this.listenTo(this._internalModel, 'loaded', this._onStatusLoaded);
    this.listenTo(this._internalModel, 'error', this._onStatusError);
    this._listenToInstanceModelEvents();
  }
};

Base.prototype._listenToInstanceModelEvents = function () {
  throw new Error('_listenToInstanceModelEvents must be implemented by the particular dataview.');
};

Base.prototype._onDataChanged = function () {
  this.trigger('dataChanged', this.getData());
};

Base.prototype._onColumnChanged = function () {
  this.trigger('columnChanged', this._column);
};

Base.prototype._onStatusLoading = function () {
  this._status = status.LOADING;
  this.trigger('statusChanged', this._status);
};

Base.prototype._onStatusLoaded = function () {
  this._status = status.LOADED;
  this.trigger('statusChanged', this._status);
};

Base.prototype._onStatusError = function (model, error) {
  this._status = status.ERROR;
  this.trigger('statusChanged', this._status, error && error.statusText ? error.statusText : error);
};

// Internal public methods

Base.prototype.$setEngine = function (engine) {
  this._source.$setEngine(engine);
  if (!this._internalModel) {
    this._createInternalModel(engine);
    this._listenToInternalModelEvents();
  }
};

Base.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = Base;
