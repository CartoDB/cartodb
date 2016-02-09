var _ = require('underscore');
var WidgetsFormCategoryDataSchemaModel = require('./schemas/data/widgets-form-category-data-schema-model');
var WidgetsFormCategoryStyleSchemaModel = require('./schemas/style/widgets-form-category-style-schema-model');
var WidgetsFormFormulaDataSchemaModel = require('./schemas/data/widgets-form-formula-data-schema-model');
var WidgetsFormFormulaStyleSchemaModel = require('./schemas/style/widgets-form-formula-style-schema-model');
var WidgetsFormHistogramDataSchemaModel = require('./schemas/data/widgets-form-histogram-data-schema-model');
var WidgetsFormHistogramStyleSchemaModel = require('./schemas/style/widgets-form-histogram-style-schema-model');
var WidgetsFormTimeSeriesDataSchemaModel = require('./schemas/data/widgets-form-time-series-data-schema-model');
var WidgetsFormTimeSeriesStyleSchemaModel = require('./schemas/style/widgets-form-time-series-style-schema-model');

module.exports = {

  createWidgetFormModel: function (formType, widgetDefModel) {
    var widgetType = widgetDefModel.get('type');
    return this[formType === 'data' ? '_createFormDataSchemaModel' : '_createFormStyleSchemaModel'][widgetType].call(this, widgetDefModel);
  },

  _createFormDataSchemaModel: {
    category: function (m) {
      var o = m.get('options');
      return new WidgetsFormCategoryDataSchemaModel({
        layer_id: m.get('layer_id'),
        title: m.get('title'),
        column: o.column,
        aggregation: o.aggregation,
        aggregationColumn: o.aggregationColumn,
        suffix: o.suffix,
        prefix: o.prefix
      });
    },
    formula: function (m) {
      var o = m.get('options');
      return new WidgetsFormFormulaDataSchemaModel({
        layer_id: m.get('layer_id'),
        title: m.get('title'),
        column: o.column,
        operation: o.operation,
        suffix: o.suffix,
        prefix: o.prefix
      });
    },
    histogram: function (m) {
      var o = m.get('options');
      return new WidgetsFormHistogramDataSchemaModel({
        layer_id: m.get('layer_id'),
        title: m.get('title'),
        column: o.column,
        bins: o.bins
      });
    },
    'time-series': function (m) {
      var o = m.get('options');
      return new WidgetsFormTimeSeriesDataSchemaModel({
        layer_id: m.get('layer_id'),
        title: m.get('title'),
        column: o.column,
        bins: o.bins,
        start: o.start,
        end: o.end
      });
    }
  },

  _createFormStyleSchemaModel: {
    category: function (m) {
      return new WidgetsFormCategoryStyleSchemaModel({
        syncData: m.get('syncData'),
        syncBoundingBox: m.get('syncBoundingBox')
      });
    },
    formula: function (m) {
      return new WidgetsFormFormulaStyleSchemaModel({
        syncData: m.get('syncData'),
        syncBoundingBox: m.get('syncBoundingBox')
      });
    },
    histogram: function (m) {
      return new WidgetsFormHistogramStyleSchemaModel({
        syncData: m.get('syncData'),
        syncBoundingBox: m.get('syncBoundingBox')
      });
    },
    'time-series': function (m) {
      return new WidgetsFormTimeSeriesStyleSchemaModel({
        syncData: m.get('syncData'),
        syncBoundingBox: m.get('syncBoundingBox')
      });
    }
  }
};
