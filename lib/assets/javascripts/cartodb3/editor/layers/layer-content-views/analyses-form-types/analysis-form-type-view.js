var _ = require('underscore');
var Backbone = require('backbone');
var TablesCollection = require('../../../../data/tables-collection');
var AnalysisSourceOptionsModel = require('./analysis-source-options-model');
var cdb = require('cartodb-deep-insights.js');
require('../../../../components/form-components/index');

var TYPE_MAP = {
  buffer: {
    FormModel: require('./buffer/analysis-buffer-form-model'),
    template: require('./buffer/analysis-buffer-form.tpl')
  },
  'trade-area': {
    FormModel: require('./trade-area/analysis-trade-area-form-model'),
    template: require('./trade-area/analysis-trade-area-form.tpl')
  },
  'point-in-polygon': {
    FormModel: require('./point-in-polygon/analysis-point-in-polygon-form-model'),
    template: require('./point-in-polygon/analysis-point-in-polygon-form.tpl')
  }
};

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.analysisDefinitionNodeModel) throw new Error('analysisDefinitionNode is required');
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._analysisDefinitionNodeModel = opts.analysisDefinitionNodeModel;

    var analysisSourceOptionsModel = new AnalysisSourceOptionsModel(null, {
      analysisDefinitionNodesCollection: this._analysisDefinitionNodeModel.collection,
      layerDefinitionsCollection: opts.layerDefinitionModel.collection,
      tablesCollection: new TablesCollection(null, {
        configModel: opts.layerDefinitionModel._configModel
      })
    });

    var type = this._analysisDefinitionNodeModel.get('type');
    var FormModel = TYPE_MAP[type].FormModel;
    this._formModel = new FormModel(this._analysisDefinitionNodeModel.attributes, {
      analysisSourceOptionsModel: analysisSourceOptionsModel,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel,
      layerDefinitionModel: opts.layerDefinitionModel
    });

    this._formModel.bind('changeSchema', this.render, this);
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();
    this._initViews();
    return this;
  },

  /**
   * @override cdb.core.View.prototype.clearSubViews
   */
  clearSubViews: function () {
    cdb.core.View.prototype.clearSubViews.apply(this, arguments);

    // Backbone.Form removes the view with the following method
    _.result(this._analysisFormView, 'remove');
  },

  _initViews: function () {
    var analysisType = this._analysisDefinitionNodeModel.get('type');
    var template = TYPE_MAP[analysisType].template;

    if (!template) {
      console.log(analysisType + ' template doesn\'t exist');
    }

    this._analysisFormView = new Backbone.Form({
      template: template,
      model: this._formModel
    });

    this._analysisFormView.bind('change', function () {
      this.commit();
    });

    this.$el.append(this._analysisFormView.render().el);

    this._analysisFormView.validate(); // to show eventual errors when form is rendered the first time
  }

});
