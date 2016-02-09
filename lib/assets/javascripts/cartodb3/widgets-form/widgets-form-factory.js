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

  _flattenAttributes: function (attrs) {
    return _.extend(_.omit(attrs, 'options'), attrs.options);
  },

  _createFormDataSchemaModel: {
    category: function (widgetDefModel) {
      return new WidgetsFormCategoryDataSchemaModel({
        layer_id: widgetDefModel.get('layer_id'),
        title: widgetDefModel.get('title'),
        column: widgetDefModel.get('column'),
        aggregation: widgetDefModel.get('aggregation'),
        aggregationColumn: widgetDefModel.get('aggregationColumn'),
        suffix: widgetDefModel.get('suffix'),
        prefix: widgetDefModel.get('prefix')
      });
    },
    formula: function (widgetDefModel) {
      return new WidgetsFormFormulaDataSchemaModel({
        layer_id: widgetDefModel.get('layer_id'),
        title: widgetDefModel.get('title'),
        column: widgetDefModel.get('column'),
        operation: widgetDefModel.get('operation'),
        suffix: widgetDefModel.get('suffix'),
        prefix: widgetDefModel.get('prefix')
      });
    },
    histogram: function (widgetDefModel) {
      return new WidgetsFormHistogramDataSchemaModel({
        layer_id: widgetDefModel.get('layer_id'),
        title: widgetDefModel.get('title'),
        column: widgetDefModel.get('column'),
        bins: widgetDefModel.get('bins')
      });
    },
    'time-series': function (widgetDefModel) {
      return new WidgetsFormTimeSeriesDataSchemaModel({
        layer_id: widgetDefModel.get('layer_id'),
        title: widgetDefModel.get('title'),
        column: widgetDefModel.get('column'),
        bins: widgetDefModel.get('bins'),
        start: widgetDefModel.get('start'),
        end: widgetDefModel.get('end')
      });
    }
  },

  _createFormStyleSchemaModel: {
    category: function (widgetDefModel) {
      return new WidgetsFormCategoryStyleSchemaModel({
        syncData: widgetDefModel.get('syncData'),
        syncBoundingBox: widgetDefModel.get('syncBoundingBox')
      });
    },
    formula: function (widgetDefModel) {
      return new WidgetsFormFormulaStyleSchemaModel({
        syncData: widgetDefModel.get('syncData'),
        syncBoundingBox: widgetDefModel.get('syncBoundingBox')
      });
    },
    histogram: function (widgetDefModel) {
      return new WidgetsFormHistogramStyleSchemaModel({
        syncData: widgetDefModel.get('syncData'),
        syncBoundingBox: widgetDefModel.get('syncBoundingBox')
      });
    },
    'time-series': function (widgetDefModel) {
      return new WidgetsFormTimeSeriesStyleSchemaModel({
        syncData: widgetDefModel.get('syncData'),
        syncBoundingBox: widgetDefModel.get('syncBoundingBox')
      });
    }
  }
};
