var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./kmeans-form.tpl');

/**
 * Form model for a means analysis
 * It has a rather complicated schema, that depends on several data points and state.
 */
module.exports = BaseAnalysisFormModel.extend({
  defaults: {
    clusters: 2
  },

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
    BaseAnalysisFormModel.prototype._setSchema.call(this, {
      source: this._primarySourceSchemaItem(),
      clusters: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.clusters-num'),
        validators: ['required', {
          type: 'interval',
          min: 2,
          max: 16
        }]
      }
    });
  }
});
