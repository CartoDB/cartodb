var _ = require('underscore');
var WidgetTypes = ['histogram', 'category', 'formula', 'time-series'];
var FormFormulaSchemaModel = require('./widget-formula-form-schema-model.js');
var FormCategorySchemaModel = require('./widget-category-form-schema-model.js');
var FormTimeSeriesSchemaModel = require('./widget-time-series-form-schema-model.js');
var FormHistogramSchemaModel = require('./widget-histogram-form-schema-model.js');

module.exports = {

  createWidgetFormModel: function (attrs) {
    this.attrs = this._flattenAttributes(attrs);
    var WidgetFormSchemaModel = this._createFormSchemaModel[attrs.type].call(this);
    return new WidgetFormSchemaModel(this.attrs);
  },

  _flattenAttributes: function (attrs) {
    return _.extend(_.omit(attrs, 'options'), attrs.options);
  },

  _createFormSchemaModel: {
    formula: function () {
      return FormFormulaSchemaModel;
    },
    category: function () {
      return FormCategorySchemaModel;
    },
    'time-series': function () {
      return FormTimeSeriesSchemaModel;
    },
    histogram: function () {
      return FormHistogramSchemaModel;
    }
  }
};
