var _ = require('underscore');
var STATUS = require('./constants').STATUS;

/**
 *
 * Represent a dataview base object.
 *
 */
function DataviewBase () {}

DataviewBase.prototype._initialize = function (options) {
  this._checkColumn(options.column);
  this._checkParams(options.params);

  this._status = STATUS.NOT_LOADED;
  this._enabled = true;
  this._column = options.column || '';
  this._params = options.params || {};
};

DataviewBase.prototype.getData = function () {
  if (this._internalModel) {
    return this._internalModel.getData();
  }
};

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

DataviewBase.prototype._setEnabled = function (enabled) {
  this._enabled = enabled;
  if (this._internalModel) {
    this._internalModel.set('enabled', enabled);
  }
  return this;
};

DataviewBase.prototype.isEnabled = function () {
  return this._enabled;
};

DataviewBase.prototype.setColumn = function (column) {
  this._column = column;
  if (this._internalModel) {
    this._internalModel.set('column', this._column);
  }
  return this;
};

DataviewBase.prototype.setParams = function (params) {
  throw new Error('setParams must be implemented by the particular dataview.');
};

// remove ?
// syncOnDataChanges
// isSyncedOnDataChanges
// syncOnBoundingChanges
// isSyncedOnBoundingChanges

DataviewBase.prototype._checkColumn = function (column) {
  if (_.isUndefined(column) || _.isEmpty(column)) {
    throw new TypeError('Column property is mandatory when creating a dataview.');
  }
  if (!_.isString(column)) {
    throw new TypeError('Column property must be a string when creating a dataview.');
  }
};

DataviewBase.prototype._checkParams = function (options) {
  throw new Error('_checkParams must be implemented by the particular dataview.');
};

DataviewBase.prototype.$setEngine = function (engine) {
  throw new Error('$setEngine must be implemented by the particular dataview.');
};

DataviewBase.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = DataviewBase;
