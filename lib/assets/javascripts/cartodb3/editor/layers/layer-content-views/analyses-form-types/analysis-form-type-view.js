var cdb = require('cartodb-deep-insights.js');
var Backbone = require('backbone');
var _ = require('underscore');
var AnalysisFormTypeFactory = require('./analysis-form-type-factory');
var DEBOUNCE_TIME = 500;
require('../../../../components/form-components/index');

var analysisFormTemplateMap = {
  buffer: require('./buffer/analysis-buffer-form.tpl'),
  'trade-area': require('./trade-area/analysis-trade-area-form.tpl')
};

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.analysisDefinitionNode) throw new Error('analysisDefinitionNode is required');
    this.model = opts.analysisDefinitionNode;
    this._analysisFormModel = AnalysisFormTypeFactory.createAnalysisFormModel(this.model);
    this._analysisFormModel.updateSchema();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    var analysisType = this.model.get('type');
    var template = analysisFormTemplateMap[analysisType];

    this._analysisFormModel.bind('change', _.debounce(this._onFormChange.bind(this), DEBOUNCE_TIME));

    this._analysisFormView = new Backbone.Form({
      template: template,
      model: this._analysisFormModel
    });

    this._analysisFormView.bind('change', function () {
      var errors = this.commit();
      if (errors) {
        console.log('errors', errors);
      }
    });

    this.$el.append(this._analysisFormView.render().el);
  },

  _onFormChange: function () {
    this.model.set(this._analysisFormModel.changed);
  },

  clean: function () {
    // Backbone.Form removes the view with the following method
    if (this._analysisFormView) {
      this._analysisFormView.remove();
    }
    cdb.core.View.prototype.clean.call(this);
  }
});
