var cdb = require('cartodb.js');
var TablesCollection = require('../../../data/tables-collection');
var AnalysisSourceOptionsModel = require('./analyses-form-types/analysis-source-options-model');
var AnalysisFormTypeView = require('./analyses-form-types/analysis-form-type-view');
var AnalysisControlsView = require('./analysis-controls-view');

var ANALYSIS_FORM_MODELS = {
  buffer: require('./analyses-form-types/area-of-influence-form-model'),
  'trade-area': require('./analyses-form-types/area-of-influence-form-model'),
  'point-in-polygon': require('./analyses-form-types/analysis-point-in-polygon-form-model')
};

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.viewModel) throw new Error('viewModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._viewModel = opts.viewModel;

    this._analysisSourceOptionsModel = new AnalysisSourceOptionsModel(null, {
      analysisDefinitionNodesCollection: this._analysisDefinitionNodeModel().collection,
      layerDefinitionsCollection: opts.layerDefinitionModel.collection,
      tablesCollection: new TablesCollection(null, {
        configModel: opts.layerDefinitionModel._configModel
      })
    });

    this._viewModel.bind('change:selectedNode', this.render, this);
    this.add_related_model(this._viewModel);
  },

  render: function () {
    this.clearSubViews();

    var nodeDefModel = this._analysisDefinitionNodeModel();
    var FormModel = ANALYSIS_FORM_MODELS[nodeDefModel.get('type')];

    var formModel = new FormModel(nodeDefModel.attributes, {
      analysisSourceOptionsModel: this._analysisSourceOptionsModel,
      layerDefinitionModel: this._layerDefinitionModel,
      parse: true
    });
    this.add_related_model(formModel);

    this._renderFormTypeView(formModel);
    this._renderControlsView(formModel);

    return this;
  },

  _renderFormTypeView: function (formModel) {
    var formView = new AnalysisFormTypeView({
      formModel: formModel,
      layerDefinitionModel: this._layerDefinitionModel
    });

    this.addView(formView);
    this.$el.append(formView.render().el);
  },

  _renderControlsView: function (formModel) {
    var view = new AnalysisControlsView({
      formModel: formModel,
      analysisDefinitionNodeModel: this._analysisDefinitionNodeModel()
    });
    this.addView(view);
    this.$el.append(view.render().el);
  },

  _analysisDefinitionNodeModel: function () {
    return this._viewModel.get('selectedNode');
  }

});
