var BaseAnalysisFormModel = require('./base-analysis-form-model');
var template = require('./sampling-form.tpl');
var _ = require('underscore');

var DEFAULT_PERCENT = 10;

/**
 * Form model for a sampling
 */
module.exports = BaseAnalysisFormModel.extend({

  initialize: function () {
    BaseAnalysisFormModel.prototype.initialize.apply(this, arguments);
    this.bind('change:percent', function () {
      this.set('sampling', +this.get('percent') / 100);
    }, this);
    this._setSchema();
  },

  parse: function (attrs) {
    return _.defaults(attrs, {
      percent: DEFAULT_PERCENT,
      sampling: DEFAULT_PERCENT / 100
    });
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
      percent: {
        type: 'Number',
        title: _t('editor.layers.analysis-form.sampling-rate'),
        validators: ['required', {
          type: 'interval',
          min: 0,
          max: 100,
          step: 1
        }],
        editorAttrs: {
          help: _t('editor.layers.analysis-form.sampling-form-model.help')
        }
      }
    };

    BaseAnalysisFormModel.prototype._setSchema.call(this, schema);
  }
});
