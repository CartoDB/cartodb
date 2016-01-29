var WidgetModel = require('./widgets/widget-model');
var CategoryWidgetModel = require('./widgets/category/category-widget-model');

/**
 * Public API to interact with dashboard widgets.
 */
var WidgetsService = function (widgetsCollection, dataviews) {
  this._widgetsCollection = widgetsCollection;
  this._dataviewModelsMap = {
    list: dataviews.createListDataview.bind(dataviews),
    formula: dataviews.createFormulaDataview.bind(dataviews),
    histogram: dataviews.createHistogramDataview.bind(dataviews),
    category: dataviews.createCategoryDataview.bind(dataviews)
  };
  this._widgetModelsMap = {
    list: function (widgetAttrs, widgetOpts) {
      return new WidgetModel(widgetAttrs, widgetOpts);
    },
    formula: function (widgetAttrs, widgetOpts) {
      return new WidgetModel(widgetAttrs, widgetOpts);
    },
    histogram: function (widgetAttrs, widgetOpts) {
      return new WidgetModel(widgetAttrs, widgetOpts);
    },
    'time-series': function (widgetAttrs, widgetOpts) {
      return new WidgetModel(widgetAttrs, widgetOpts);
    },
    category: function (widgetAttrs, widgetOpts) {
      return new CategoryWidgetModel(widgetAttrs, widgetOpts);
    }
  };
};

WidgetsService.prototype.get = function (id) {
  return this._widgetsCollection.get(id);
};

WidgetsService.prototype.newCategoryModel = function (attrs, layer) {
  attrs.type = attrs.options.type = 'category';
  return this._newModel(attrs, layer);
};

WidgetsService.prototype.newHistogramModel = function (attrs, layer) {
  attrs.type = attrs.options.type = 'histogram';
  return this._newModel(attrs, layer);
};

WidgetsService.prototype.newFormulaModel = function (attrs, layer) {
  attrs.type = attrs.options.type = 'formula';
  return this._newModel(attrs, layer);
};

WidgetsService.prototype.newListModel = function (attrs, layer) {
  attrs.type = attrs.options.type = 'list';
  return this._newModel(attrs, layer);
};

WidgetsService.prototype.newTimeSeriesModel = function (attrs, layer) {
  attrs.type = 'time-series';
  attrs.options.type = 'histogram';
  return this._newModel(attrs, layer);
};

WidgetsService.prototype._newModel = function (attrs, layer) {
  var dataviewAttrs = attrs.options;

  if (layer) {
    var dataviewModel;
    if (dataviewAttrs) {
      dataviewModel = this._dataviewModelsMap[dataviewAttrs.type](layer, dataviewAttrs);
      var widgetOpts = {
        dataviewModel: dataviewModel
      };
      var widgetModel = this._widgetModelsMap[attrs.type](attrs, widgetOpts);
      return this._widgetsCollection.add(widgetModel);
    } else {
      cdb.log.error('options are required');
    }
  } else {
    cdb.log.error('layer is required');
  }
};

module.exports = WidgetsService;
