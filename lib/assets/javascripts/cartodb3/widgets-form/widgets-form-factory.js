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

  createWidgetFormModel: function (form_type, attrs) {
    this.attrs = this._flattenAttributes(attrs);
    var WidgetFormSchemaModel = this[form_type === 'data' ? '_createFormDataSchemaModel' : '_createFormStyleSchemaModel'][attrs.type].call(this);
    return new WidgetFormSchemaModel(this.attrs);
  },

  _flattenAttributes: function (attrs) {
    return _.extend(_.omit(attrs, 'options'), attrs.options);
  },

  _createFormDataSchemaModel: {
    category: function () {
      return WidgetsFormCategoryDataSchemaModel;
    },
    formula: function () {
      return WidgetsFormFormulaDataSchemaModel;
    },
    histogram: function () {
      return WidgetsFormHistogramDataSchemaModel;
    },
    'time-series': function () {
      return WidgetsFormTimeSeriesDataSchemaModel;
    }
  },

  _createFormStyleSchemaModel: {
    category: function () {
      return WidgetsFormCategoryStyleSchemaModel;
    },
    formula: function () {
      return WidgetsFormFormulaStyleSchemaModel;
    },
    histogram: function () {
      return WidgetsFormHistogramStyleSchemaModel;
    },
    'time-series': function () {
      return WidgetsFormTimeSeriesStyleSchemaModel;
    }
  }
};
