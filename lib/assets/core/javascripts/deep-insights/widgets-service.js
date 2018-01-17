var _ = require('underscore');
var WidgetModel = require('./widgets/widget-model');
var CategoryWidgetModel = require('./widgets/category/category-widget-model');
var HistogramWidgetModel = require('./widgets/histogram/histogram-widget-model');
var TimeSeriesWidgetModel = require('./widgets/time-series/time-series-widget-model');

var WIDGETSTYLEPARAMS = {
  auto_style_allowed: 'autoStyleEnabled'
};

// We create an object with options off the attributes
var makeWidgetStyleOptions = function (attrs) {
  return _.reduce(WIDGETSTYLEPARAMS, function (memo, value, key) {
    if (attrs[key] !== undefined) {
      memo[value] = attrs[key];
      return memo;
    }
  }, {});
};

var _checkProperties = function (obj, propertiesArray) {
  _.each(propertiesArray, function (prop) {
    if (obj[prop] === undefined) {
      throw new Error(prop + ' is required');
    }
  });
};

var extendAttrs = function (attrs, state, hasInitialState) {
  return _.extend(attrs, state, { hasInitialState: hasInitialState }); // Will overwrite preset attributes with the ones passed on the state
};

var checkAnalysisModel = function (attrs) {
  if (!(attrs.source instanceof Object) || !attrs.source.cid) {
    throw new Error('Source must be defined and be an instance of AnalysisModel.');
  }
};

/**
 * Public API to interact with dashboard widgets.
 */
var WidgetsService = function (widgetsCollection, dataviews) {
  this._widgetsCollection = widgetsCollection;
  this._dataviews = dataviews;
};

WidgetsService.prototype.getCollection = function () {
  return this._widgetsCollection;
};

WidgetsService.prototype.get = function (id) {
  return this._widgetsCollection.get(id);
};

WidgetsService.prototype.getList = function () {
  return this._widgetsCollection.models;
};

/**
 * @param {Object} attrs
 * @param {String} attrs.title Title rendered on the widget view
 * @param {String} attrs.column Name of column to use to aggregate
 * @param {String} attrs.aggregation Name of aggregation operation to apply to get categories
 *   can be any of ['sum', 'count']. Default is 'count'
 * @param {String} attrs.aggregation_column column to be used for the aggregation operation
 *  it only applies for sum operations.
 * @param {Object} attrs.source Object with the id of the source analysis node that the widget points to
 * @param {Object} layer Instance of a layer model (cartodb.js)
 * @return {CategoryWidgetModel}
 */
WidgetsService.prototype.createCategoryModel = function (attrs, layer, state) {
  _checkProperties(attrs, ['title']);
  var extendedAttrs = extendAttrs(attrs, state, this._widgetsCollection.hasInitialState());
  checkAnalysisModel(extendedAttrs);

  var dataviewModel = this._dataviews.createCategoryModel(extendedAttrs);

  var ATTRS_NAMES = ['id', 'title', 'order', 'collapsed', 'prefix', 'suffix', 'show_stats', 'show_source', 'style', 'hasInitialState'];
  var widgetAttrs = _.pick(extendedAttrs, ATTRS_NAMES);
  var options = makeWidgetStyleOptions(extendedAttrs);

  widgetAttrs.attrsNames = ATTRS_NAMES;

  var widgetModel = new CategoryWidgetModel(widgetAttrs, {
    dataviewModel: dataviewModel,
    layerModel: layer
  }, options);
  widgetModel.setInitialState(state);
  this._widgetsCollection.add(widgetModel);

  return widgetModel;
};

/**
 * @param {Object} attrs
 * @param {String} attrs.title Title rendered on the widget view
 * @param {String} attrs.column Name of column
 * @param {Number} attrs.bins Count of bins
 * @param {Object} layer Instance of a layer model (cartodb.js)
 * @return {WidgetModel}
 */
WidgetsService.prototype.createHistogramModel = function (attrs, layer, state, opts) {
  _checkProperties(attrs, ['title']);
  var extendedAttrs = extendAttrs(attrs, state, this._widgetsCollection.hasInitialState());
  checkAnalysisModel(extendedAttrs);
  var dataviewModel = this._dataviews.createHistogramModel(extendedAttrs);

  // Default bins attribute was removed from dataViewModel because of time-series aggregation.
  // Just in case it's needed for histogram models we added it here.
  if (!dataviewModel.has('bins')) {
    dataviewModel.set('bins', 10, { silent: true });
  }

  var attrsNames = ['id', 'title', 'order', 'collapsed', 'bins', 'show_stats', 'show_source', 'normalized', 'style', 'hasInitialState', 'table_name'];
  var widgetAttrs = _.pick(extendedAttrs, attrsNames);
  var options = makeWidgetStyleOptions(extendedAttrs);

  widgetAttrs.type = 'histogram';
  widgetAttrs.attrsNames = attrsNames;

  var widgetModel = new HistogramWidgetModel(widgetAttrs, {
    dataviewModel: dataviewModel,
    layerModel: layer
  }, options);
  widgetModel.setInitialState(state);
  this._widgetsCollection.add(widgetModel);

  return widgetModel;
};

/**
 * @param {Object} attrs
 * @param {String} attrs.title Title rendered on the widget view
 * @param {String} attrs.column Name of column
 * @param {String} attrs.operation Name of operation to use, can be any of ['min', 'max', 'avg', 'sum']
 * @param {Object} layer Instance of a layer model (cartodb.js)
 * @return {CategoryWidgetModel}
 */
WidgetsService.prototype.createFormulaModel = function (attrs, layer, state) {
  _checkProperties(attrs, ['title']);
  var extendedAttrs = extendAttrs(attrs, state, this._widgetsCollection.hasInitialState());
  checkAnalysisModel(extendedAttrs);
  var dataviewModel = this._dataviews.createFormulaModel(extendedAttrs);

  var ATTRS_NAMES = ['id', 'title', 'order', 'collapsed', 'prefix', 'suffix', 'show_stats', 'show_source', 'description', 'hasInitialState'];
  var widgetAttrs = _.pick(extendedAttrs, ATTRS_NAMES);
  widgetAttrs.type = 'formula';
  widgetAttrs.attrsNames = ATTRS_NAMES;

  var widgetModel = new WidgetModel(widgetAttrs, {
    dataviewModel: dataviewModel,
    layerModel: layer
  });
  widgetModel.setInitialState(state);
  this._widgetsCollection.add(widgetModel);

  return widgetModel;
};

/**
 * @param {Object} attrs
 * @param {String} attrs.column Name of column that contains
 * @param {Object} layer Instance of a layer model (cartodb.js)
 * @param {Number} bins
 * @return {WidgetModel}
 */
WidgetsService.prototype.createTimeSeriesModel = function (attrs, layer, state, opts) {
  // TODO will other kind really work for a time-series?
  attrs.column_type = attrs.column_type || 'date';
  checkAnalysisModel(attrs);
  var dataviewModel = this._dataviews.createHistogramModel(attrs);

  var ATTRS_NAMES = ['id', 'style', 'title', 'normalized', 'animated', 'timezone'];
  var widgetAttrs = _.pick(attrs, ATTRS_NAMES);
  widgetAttrs.type = 'time-series';
  widgetAttrs.attrsNames = ATTRS_NAMES;

  var widgetModel = new TimeSeriesWidgetModel(widgetAttrs, {
    dataviewModel: dataviewModel,
    layerModel: layer
  }, opts);
  widgetModel.setInitialState(state);
  this._widgetsCollection.add(widgetModel);

  return widgetModel;
};

WidgetsService.prototype.setWidgetsState = function (state) {
  this._widgetsCollection.setStates(state);
};

module.exports = WidgetsService;
