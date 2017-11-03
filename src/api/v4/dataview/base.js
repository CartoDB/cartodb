var _ = require('underscore');
var Backbone = require('backbone');
var STATUS = require('../constants').STATUS;

/**
 *
 * Represent a dataview base object.
 *
 */
function DataviewBase () {}

_.extend(DataviewBase.prototype, Backbone.Events);

DataviewBase.prototype.getStatus = function () {
  return this._status;
};

DataviewBase.prototype.isLoading = function () {
  return this._status === STATUS.LOADING;
};

DataviewBase.prototype.isLoaded = function () {
  return this._status === STATUS.LOADED;
};

DataviewBase.prototype.hasError = function () {
  return this._status === STATUS.ERROR;
};

DataviewBase.prototype.enable = function () {
  return this._setEnabled(true);
};

DataviewBase.prototype.disable = function () {
  return this._setEnabled(false);
};

DataviewBase.prototype.isEnabled = function () {
  return this._enabled;
};

DataviewBase.prototype.setColumn = function (column) {
  this._checkColumn(column);
  this._column = column;
  if (this._internalModel) {
    this._internalModel.set('column', this._column);
  }
  return this;
};

DataviewBase.prototype.getColumn = function () {
  return this._column;
};

DataviewBase.prototype.getData = function () {
  throw new Error('getData must be implemented by the particular dataview.');
};

// syncOnBoundingChanges
// isSyncedOnBoundingChanges

// Protected methods

DataviewBase.prototype._initialize = function (source, column, options) {
  options = this._defaultOptions(options);

  this._checkSource(source);
  this._checkColumn(column);
  this._checkOptions(options);

  this._source = source;
  this._column = column;
  this._options = options;
  this._status = STATUS.NOT_LOADED;
  this._enabled = true;
};

DataviewBase.prototype._defaultOptions = function (options) {
  throw new Error('_defaultOptions must be implemented by the particular dataview.');
};

DataviewBase.prototype._checkSource = function (source) {
  // TODO
  return true;
};

DataviewBase.prototype._checkColumn = function (column) {
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

DataviewBase.prototype._checkOptions = function (options) {
  throw new Error('_checkOptions must be implemented by the particular dataview.');
};

DataviewBase.prototype._createInternalModel = function (engine) {
  throw new Error('_createInternalModel must be implemented by the particular dataview.');
};

DataviewBase.prototype._setEnabled = function (enabled) {
  this._enabled = enabled;
  if (this._internalModel) {
    this._internalModel.set('enabled', enabled);
  }
  return this;
};

DataviewBase.prototype._listenToInternalModelEvents = function () {
  if (this._internalModel) {
    this.listenTo(this._internalModel, 'change:data', this._onDataChanged);
    this.listenTo(this._internalModel, 'change:column', this._onColumnChanged);
    this.listenTo(this._internalModel, 'loading', this._onStatusLoading);
    this.listenTo(this._internalModel, 'loaded', this._onStatusLoaded);
    this.listenTo(this._internalModel, 'error', this._onStatusError);
    this._listenToInstanceModelEvents();
  }
};

DataviewBase.prototype._listenToInstanceModelEvents = function () {
  throw new Error('_listenToInstanceModelEvents must be implemented by the particular dataview.');
};

DataviewBase.prototype._onDataChanged = function () {
  this.trigger('dataChanged', this.getData());
};

DataviewBase.prototype._onColumnChanged = function () {
  this.trigger('columnChanged', this._column);
};

DataviewBase.prototype._onStatusLoading = function () {
  this._status = STATUS.LOADING;
  this.trigger('statusChanged', this._status);
};

DataviewBase.prototype._onStatusLoaded = function () {
  this._status = STATUS.LOADED;
  this.trigger('statusChanged', this._status);
};

DataviewBase.prototype._onStatusError = function (model, error) {
  this._status = STATUS.ERROR;
  this.trigger('statusChanged', this._status, error && error.statusText ? error.statusText : error);
};

// Internal public methods

DataviewBase.prototype.$setEngine = function (engine) {
  this._source.$setEngine(engine);
  if (!this._internalModel) {
    this._createInternalModel(engine);
    this._listenToInternalModelEvents();
  }
};

DataviewBase.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = DataviewBase;
