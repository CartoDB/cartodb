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

WidgetsService.prototype.addCategoryWidget = function (layer, attrs) {
  this._addWidget(layer, attrs);
};

WidgetsService.prototype.addHistogramWidget = function (layer, attrs) {
  this._addWidget(layer, attrs);
};

WidgetsService.prototype.addFormulaWidget = function (layer, attrs) {
  this._addWidget(layer, attrs);
};

WidgetsService.prototype.addTimeSeriesWidget = function (layer, attrs) {
  this._addWidget(layer, attrs);
};

WidgetsService.prototype.addListWidget = function (layer, attrs) {
  this._addWidget(layer, attrs);
};

WidgetsService.prototype._addWidget = function (layer, attrs) {
  if (!layer) {
    cdb.log.error('no layer found for dataview ' + JSON.stringify(dataviewAttrs));
  } else {
    // Create dataview if there's a definition provided
    var dataviewModel;
    var dataviewAttrs = attrs.options;
    if (dataviewAttrs) {
      // TODO not ideal, should have a more maintainable way of mapping
      dataviewAttrs.type = attrs.type === 'time-series'
        ? 'histogram' // Time-series widget is represented by a histogram, so re-map the type
        : attrs.type;

      dataviewModel = this._dataviewModelsMap[dataviewAttrs.type](layer, dataviewAttrs);
    }

    var widgetOpts = {
      dataviewModel: dataviewModel
    };
    var widgetModel = this._widgetModelsMap[attrs.type](attrs, widgetOpts);
    this._widgetsCollection.add(widgetModel);
  }
};

module.exports = WidgetsService;
