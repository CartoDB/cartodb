var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./spatial-markov-trend.tpl');
var ColumnOptions = require('../column-options');

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

  /**
   * @override {BaseAnalysisFormModel._setSchema}
   */
  _setSchema: function () {
    var schema = {
      source: this._primarySourceSchemaItem(),
      time_columns: {
        type: 'Text',
        title: _t('editor.layers.analysis-form.time-columns')
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }

});
