var _ = require('underscore');
var Backbone = require('backbone');
var cdb = require('cartodb-deep-insights.js');
require('../../../../components/form-components/index');
var AnalysisFormTypeFactory = require('./analysis-form-type-factory');

var DEBOUNCE_TIME = 500;

var analysisFormTemplateMap = {
  buffer: require('./buffer/analysis-buffer-form.tpl'),
  'trade-area': require('./trade-area/analysis-trade-area-form.tpl'),
  'point-in-polygon': require('./point-in-polygon/analysis-point-in-polygon-form.tpl')
};

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.analysisDefinitionNode) throw new Error('analysisDefinitionNode is required');
    this.model = opts.analysisDefinitionNode;
    this._analysisFormModel = AnalysisFormTypeFactory.createAnalysisFormModel(this.model);
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

    if (!template) {
      console.log(analysisType + ' template doesn\'t exist');
    }

    this._analysisFormModel.bind('change', _.debounce(this._onFormChange.bind(this), DEBOUNCE_TIME));

    this._analysisFormView = new Backbone.Form({
      template: template,
      model: this._analysisFormModel
    });

    this._analysisFormView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._analysisFormView.render().el);

    this._analysisFormView.validate(); // to show eventual errors when form is rendered the first time
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
