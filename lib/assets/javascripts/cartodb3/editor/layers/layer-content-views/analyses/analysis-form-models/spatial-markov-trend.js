var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./spatial-markov-trend.tpl');
var _ = require('underscore');

/**
 */
module.exports = BaseAnalysisFormModel.extend({
  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);
    this._setSchema();
  },

  getTemplate: function () {
    return template;
  },

  // this is a temporal workaround to have a list of columns
  // it should be replaced when the column list selector is finished
  _formatAttrs: function (formAttrs) {
    var attrs = _.clone(formAttrs);
    attrs.time_columns = attrs.time_columns.split(',');
    return BaseAnalysisFormModel.prototype._formatAttrs.call(this, attrs);
  },

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var schema = {
      source: this._primarySourceSchemaItem(),
      time_columns: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.spatial-markov-trend-time-columns')
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }

});
