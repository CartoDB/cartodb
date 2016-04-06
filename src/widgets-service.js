var _ = require('underscore');
var WidgetModel = require('./widgets/widget-model');
var CategoryWidgetModel = require('./widgets/category/category-widget-model');
var HistogramWidgetModel = require('./widgets/histogram/histogram-widget-model');

/**
 * Public API to interact with dashboard widgets.
 */
var WidgetsService = function (widgetsCollection, dataviews) {
  this._widgetsCollection = widgetsCollection;
  this._dataviews = dataviews;
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
 * @param {Object} layer Instance of a layer model (cartodb.js)
 * @return {CategoryWidgetModel}
 */
WidgetsService.prototype.createCategoryModel = function (attrs, layer) {
  _checkProperties(attrs, ['title']);

  var dataviewModel = this._dataviews.createCategoryModel(layer, attrs);

  var attrsNames = ['id', 'title', 'order', 'collapsed', 'prefix', 'suffix', 'show_stats'];
  var widgetAttrs = _.pick(attrs, attrsNames);
  widgetAttrs.attrsNames = attrsNames;

  var widgetModel = new CategoryWidgetModel(widgetAttrs, {
    dataviewModel: dataviewModel
  });
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
WidgetsService.prototype.createHistogramModel = function (attrs, layer) {
  _checkProperties(attrs, ['title']);

  var dataviewModel = this._dataviews.createHistogramModel(layer, attrs);

  var attrsNames = ['id', 'title', 'order', 'collapsed', 'bins', 'show_stats', 'normalized'];
  var widgetAttrs = _.pick(attrs, attrsNames);
  widgetAttrs.type = 'histogram';
  widgetAttrs.attrsNames = attrsNames;

  var widgetModel = new HistogramWidgetModel(widgetAttrs, {
    dataviewModel: dataviewModel
  });
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
WidgetsService.prototype.createFormulaModel = function (attrs, layer) {
  _checkProperties(attrs, ['title']);

  var dataviewModel = this._dataviews.createFormulaModel(layer, attrs);

  var attrsNames = ['id', 'title', 'order', 'collapsed', 'prefix', 'suffix', 'show_stats', 'description'];
  var widgetAttrs = _.pick(attrs, attrsNames);
  widgetAttrs.type = 'formula';
  widgetAttrs.attrsNames = attrsNames;

  var widgetModel = new WidgetModel(widgetAttrs, {
    dataviewModel: dataviewModel
  });
  this._widgetsCollection.add(widgetModel);

  return widgetModel;
};

/**
 * @param {Object} attrs
 * @param {String} attrs.title Title rendered on the widget view
 * @param {Array} attrs.columns Names of columns
 * @param {Number} attrs.bins Count of bins
 * @param {Object} layer Instance of a layer model (cartodb.js)
 * @return {WidgetModel}
 */
WidgetsService.prototype.createListModel = function (attrs, layer) {
  _checkProperties(attrs, ['title', 'columns_title']);

  var dataviewModel = this._dataviews.createListModel(layer, attrs);

  var attrsNames = ['id', 'title', 'order', 'columns_title', 'show_stats'];
  var widgetAttrs = _.pick(attrs, attrsNames);
  widgetAttrs.type = 'list';
  widgetAttrs.attrsNames = attrsNames;

  var widgetModel = new WidgetModel(widgetAttrs, {
    dataviewModel: dataviewModel
  });
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
WidgetsService.prototype.createTimeSeriesModel = function (attrs, layer) {
  // TODO will other kind really work for a time-series?
  attrs.column_type = attrs.column_type || 'date';
  var dataviewModel = this._dataviews.createHistogramModel(layer, attrs);

  var attrsNames = ['id'];
  var widgetAttrs = _.pick(attrs, attrsNames);
  widgetAttrs.type = 'time-series';
  widgetAttrs.attrsNames = attrsNames;

  var widgetModel = new WidgetModel(widgetAttrs, {
    dataviewModel: dataviewModel
  });
  this._widgetsCollection.add(widgetModel);

  return widgetModel;
};

function _checkProperties (obj, propertiesArray) {
  _.each(propertiesArray, function (prop) {
    if (obj[prop] === undefined) {
      throw new Error(prop + ' is required');
    }
  });
}

module.exports = WidgetsService;
