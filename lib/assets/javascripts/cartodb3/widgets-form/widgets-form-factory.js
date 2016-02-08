var _ = require('underscore');

var FormFormulaDataSchemaModel = require('./widget-formula-form-data-schema-model.js');
var FormCategoryDataSchemaModel = require('./widget-category-form-data-schema-model.js');
var FormTimeSeriesDataSchemaModel = require('./widget-time-series-form-data-schema-model.js');
var FormHistogramDataSchemaModel = require('./widget-histogram-form-data-schema-model.js');

var FormFormulaStyleSchemaModel = require('./widget-formula-form-style-schema-model.js');
var FormCategoryStyleSchemaModel = require('./widget-category-form-style-schema-model.js');
var FormTimeSeriesStyleSchemaModel = require('./widget-time-series-form-style-schema-model.js');
var FormHistogramStyleSchemaModel = require('./widget-histogram-form-style-schema-model.js');

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
    formula: function () {
      return FormFormulaDataSchemaModel;
    },
    category: function () {
      return FormCategoryDataSchemaModel;
    },
    'time-series': function () {
      return FormTimeSeriesDataSchemaModel;
    },
    histogram: function () {
      return FormHistogramDataSchemaModel;
    }
  },

  _createFormStyleSchemaModel: {
    formula: function () {
      return FormFormulaStyleSchemaModel;
    },
    category: function () {
      return FormCategoryStyleSchemaModel;
    },
    'time-series': function () {
      return FormTimeSeriesStyleSchemaModel;
    },
    histogram: function () {
      return FormHistogramStyleSchemaModel;
    }
  }
};
