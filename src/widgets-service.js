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
  try {
    _checkProperties(attrs, ['title', 'column']);
  } catch (err) {
    throw new Error('Error creating newCategoryModel, ' + err.message);
  }

  var dataviewModel = this._dataviews.createCategoryModel(layer, {
    type: 'category',
    column: attrs.column,
    aggregation: attrs.aggregation || 'count',
    aggregation_column: attrs.aggregation_column || attrs.column,
    suffix: attrs.suffix,
    prefix: attrs.prefix
  });

  var widgetModel = new CategoryWidgetModel({
    id: attrs.id,
    type: 'category',
    title: attrs.title,
    attrsNames: ['title', 'collapsed'],
    dataviewModelAttrsNames: ['column', 'aggregation', 'aggregation_column']
  }, {
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
  try {
    _checkProperties(attrs, ['title', 'column']);
  } catch (err) {
    throw new Error('Error creating newHistogramModel, ' + err.message);
  }

  var dataviewModel = this._dataviews.createHistogramModel(layer, {
    type: 'histogram',
    column: attrs.column,
    bins: attrs.bins || 10
  });

  var widgetModel = new HistogramWidgetModel({
    id: attrs.id,
    type: 'histogram',
    title: attrs.title,
    attrsNames: ['title', 'collapsed'],
    dataviewModelAttrsNames: ['column', 'bins']
  }, {
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
  try {
    _checkProperties(attrs, ['title', 'column', 'operation']);
  } catch (err) {
    throw new Error('Error creating newFormulaModel, ' + err.message);
  }

  var dataviewModel = this._dataviews.createFormulaModel(layer, {
    type: 'formula',
    column: attrs.column,
    operation: attrs.operation,
    suffix: attrs.suffix,
    prefix: attrs.prefix
  });

  var widgetModel = new WidgetModel({
    id: attrs.id,
    type: 'formula',
    title: attrs.title,
    attrsNames: ['title', 'collapsed'],
    dataviewModelAttrsNames: ['column', 'operation', 'prefix', 'suffix']
  }, {
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
  try {
    _checkProperties(attrs, ['title', 'columns', 'columns_title']);
  } catch (err) {
    throw new Error('Error creating newListModel, ' + err.message);
  }

  var dataviewModel = this._dataviews.createListModel(layer, {
    type: 'list',
    columns: attrs.columns
  });

  var widgetModel = new WidgetModel({
    id: attrs.id,
    type: 'list',
    title: attrs.title,
    columns_title: attrs.columns_title,
    attrsNames: ['title'],
    dataviewModelAttrsNames: ['columns']
  }, {
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
 * @param {Number} attrs.start
 * @param {Number} attrs.end
 * @return {WidgetModel}
 */
WidgetsService.prototype.createTimeSeriesModel = function (attrs, layer) {
  try {
    _checkProperties(attrs, ['column', 'bins', 'start', 'end']);
  } catch (err) {
    throw new Error('Error creating newTimeSeriesModel, ' + err.message);
  }

  var dataviewModel = this._dataviews.createHistogramModel(layer, {
    type: 'histogram',
    column: attrs.column,
    column_type: attrs.column_type || 'date',
    bins: attrs.bins,
    start: attrs.start,
    end: attrs.end
  });

  var widgetModel = new WidgetModel({
    id: attrs.id,
    type: 'time-series',
    dataviewModelAttrsNames: ['column', 'column_type', 'bins', 'start', 'end']
  }, {
    dataviewModel: dataviewModel
  });
  this._widgetsCollection.add(widgetModel);

  return widgetModel;
};

function _checkProperties (obj, propertiesArray) {
  _.each(propertiesArray, function (prop) {
    if (obj[prop] === undefined) {
      throw new Error('\'' + prop + '\' should be provided');
    }
  });
}

module.exports = WidgetsService;
