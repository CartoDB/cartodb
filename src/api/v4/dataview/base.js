var _ = require('underscore');
var Backbone = require('backbone');
var status = require('../constants').status;
var SourceBase = require('../source/base');
var FilterBase = require('../filter/base');
var BoundingBoxFilter = require('../filter/bounding-box');
var BoundingBoxLeafletFilter = require('../filter/bounding-box-leaflet');
var CartoError = require('../error-handling/carto-error');
var CartoValidationError = require('../error-handling/carto-validation-error');

/**
 * Base class for dataview objects.
 *
 * Dataviews are a way to extract data from a CARTO account in predefined ways
 * (eg: a list of categories, the result of a formula operation, etc.). See
 * carto.dataview.Base subclasses to learn about each way of getting data.
 *
 * All dataviews point to a data source (dataset, sql query) that might change
 * due to different reasons (eg: SQL query changed). Dataview objects will trigger
 * events to notify subscribers when new data is available.
 *
 * @constructor
 * @abstract
 * @memberof carto.dataview
 * @fires carto.dataview.Base.columnChanged
 * @fires carto.dataview.Base.statusChanged
 * @api
 */
function Base () { }

_.extend(Base.prototype, Backbone.Events);

/**
 * Return the current dataview status.
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
 * Enable the dataview. When enabled, a dataview fetches new data
 * when the map changes (changing map configuration or changing map
 * bounding box).
 *
 * @return {carto.dataview.Base} this
 * @api
 */
Base.prototype.enable = function () {
  return this._setEnabled(true);
};

/**
 * Disable the dataview. This stops the dataview from fetching new
 * data when there is a map change (like changing map configuration or changing map
 * bounding box).
 *
 * @return {carto.dataview.Base} this
 * @api
 */
Base.prototype.disable = function () {
  return this._setEnabled(false);
};

/**
 * Return true if the dataview is enabled.
 *
 * @return {boolean}
 * @api
 */
Base.prototype.isEnabled = function () {
  return this._enabled;
};

/**
 * Return the current source.
 *
 * @return {carto.source.Base} Current source object
 * @api
 */
Base.prototype.getSource = function () {
  return this._source;
};

/**
 * Set the dataview column.
 *
 * @param  {string} column
 * @fires carto.dataview.Base.columnChanged
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
 * Return the current dataview column.
 *
 * @return {string} Current dataview column
 * @api
 */
Base.prototype.getColumn = function () {
  return this._column;
};

/**
 * Add a filter.
 *
 * @param  {carto.filter.Base} filter
 * @return {carto.dataview.Base} this
 * @api
 */
Base.prototype.addFilter = function (filter) {
  this._checkFilter(filter);
  if ((filter !== this._boundingBoxFilter) &&
    (filter instanceof BoundingBoxFilter || filter instanceof BoundingBoxLeafletFilter)) {
    this._addBoundingBoxFilter(filter);
  }
  return this;
};

/**
 * Remove a filter.
 *
 * @param  {carto.filter.Base} filter
 * @return {carto.dataview.Base} this
 * @api
 */
Base.prototype.removeFilter = function (filter) {
  this._checkFilter(filter);
  if ((filter === this._boundingBoxFilter) &&
    (filter instanceof BoundingBoxFilter || filter instanceof BoundingBoxLeafletFilter)) {
    this._removeBoundingBoxFilter();
  }
  return this;
};

/**
 * Return true if the filter is added.
 *
 * @param  {carto.filter.Base} filter
 * @return {carto.dataview.Base} this
 * @api
 */
Base.prototype.hasFilter = function (filter) {
  this._checkFilter(filter);
  return (filter === this._boundingBoxFilter) &&
    (this._internalModel && this._internalModel.get('sync_on_bbox_change')) &&
    (filter instanceof BoundingBoxFilter || filter instanceof BoundingBoxLeafletFilter);
};

Base.prototype.getData = function () {
  throw new Error('getData must be implemented by the particular dataview.');
};

// Protected methods

Base.prototype.DEFAULTS = {};

/**
 * Initialize dataview.
 *
 * @param {carto.source.Base} source - The source where the dataview will fetch the data
 * @param {string} column - The column name to get the data
 * @param  {object} options - It depends on the instance
 */
Base.prototype._initialize = function (source, column, options) {
  options = _.defaults(options || {}, this.DEFAULTS);

  this._checkSource(source);
  this._checkColumn(column);
  this._checkOptions(options);

  this._source = source;
  this._column = column;
  this._options = options;

  this._status = status.NOT_LOADED;
  this._enabled = true;
  this._boundingBoxFilter = null;
};

Base.prototype._checkSource = function (source) {
  if (!(source instanceof SourceBase)) {
    throw this._getValidationError('sourceRequired');
  }
};

Base.prototype._checkColumn = function (column) {
  if (_.isUndefined(column)) {
    throw this._getValidationError('columnRequired');
  }
  if (!_.isString(column)) {
    throw this._getValidationError('columnString');
  }
  if (_.isEmpty(column)) {
    throw this._getValidationError('emptyColumn');
  }
};

Base.prototype._checkOptions = function (options) {
  throw new Error('_checkOptions must be implemented by the particular dataview.');
};

Base.prototype._checkFilter = function (filter) {
  if (!(filter instanceof FilterBase)) {
    throw this._getValidationError('filterRequired');
  }
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

Base.prototype._listenToInternalModelSharedEvents = function () {
  if (this._internalModel) {
    this.listenTo(this._internalModel, 'change:data', this._onDataChanged);
    this.listenTo(this._internalModel, 'change:column', this._onColumnChanged);
    this.listenTo(this._internalModel, 'loading', this._onStatusLoading);
    this.listenTo(this._internalModel, 'loaded', this._onStatusLoaded);
    this.listenTo(this._internalModel, 'statusError', this._onStatusError);
    this._listenToInternalModelSpecificEvents();
  }
};

Base.prototype._listenToInternalModelSpecificEvents = function () {
  throw new Error('_listenToInternalModelSpecificEvents must be implemented by the particular dataview.');
};

Base.prototype._onDataChanged = function () {
  this.trigger('dataChanged', this.getData());
};

Base.prototype._onColumnChanged = function () {
  if (this._internalModel) {
    this._column = this._internalModel.get('column');
  }
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
  this.trigger('statusChanged', this._status, error);
  this._triggerError(this, error);
};

Base.prototype._changeProperty = function (key, value, internalKey) {
  var prevValue = this['_' + key];
  this['_' + key] = value;
  if (this._internalModel) {
    this._internalModel.set(internalKey || key, value);
  } else if (prevValue !== value) {
    this._triggerChange(key, value);
  }
};

Base.prototype._triggerChange = function (key, value) {
  this.trigger(key + 'Changed', value);
};

/**
 * Fire a CartoError event from a internalDataviewError.
 */
Base.prototype._triggerError = function (model, internalDataviewError) {
  this.trigger('error', new CartoError(internalDataviewError));
};

Base.prototype._addBoundingBoxFilter = function (filter) {
  this._boundingBoxFilter = filter;
  if (this._internalModel) {
    this._internalModel.addBBoxFilter(this._boundingBoxFilter.$getInternalModel());
    this._internalModel.set('sync_on_bbox_change', true);
  }
};

Base.prototype._removeBoundingBoxFilter = function () {
  this._boundingBoxFilter = null;
  if (this._internalModel) {
    this._internalModel.set('sync_on_bbox_change', false);
  }
};

Base.prototype._getValidationError = function (code) {
  return new CartoValidationError('dataview', code);
};

// Internal public methods

Base.prototype.$setEngine = function (engine) {
  this._source.$setEngine(engine);
  if (!this._internalModel) {
    this._createInternalModel(engine);
    this._listenToInternalModelSharedEvents();
  }
};

Base.prototype.$getInternalModel = function () {
  return this._internalModel;
};

module.exports = Base;

/**
 * Event triggered when the column in a dataview changes.
 *
 * Contains a single argument with the name of the changed column.
 *
 * @event carto.dataview.Base.columnChanged
 * @type {string}
 * @api
 */

/**
 * Event triggered when the status in a dataview changes.
 *
 * Contains a single argument with the new status.
 *
 * @event carto.dataview.Base.statusChanged
 * @type {carto.dataview.status}
 * @api
 */
