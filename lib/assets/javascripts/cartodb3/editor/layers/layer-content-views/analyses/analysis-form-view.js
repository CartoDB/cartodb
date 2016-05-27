var cdb = require('cartodb.js');
var AnalysisFormTypeView = require('./analysis-form-type-view');
var AnalysisControlsView = require('./analysis-controls-view');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.analysisFormsCollection) throw new Error('analysisFormsCollection is required');
    if (!opts.analysisDefinitionNodesCollection) throw new Error('analysisDefinitionNodesCollection is required');
    if (!opts.viewModel) throw new Error('viewModel is required');

    this._analysisFormsCollection = opts.analysisFormsCollection;
    this._analysisDefinitionNodesCollection = opts.analysisDefinitionNodesCollection;
    this._viewModel = opts.viewModel;

    this._viewModel.bind('change:selectedNodeId', this.render, this);
    this.add_related_model(this._viewModel);
  },

  render: function () {
    this.clearSubViews();

    var formModel = this._analysisFormsCollection.get(this._viewModel.get('selectedNodeId')) || this._analysisFormsCollection.first();

    this._renderFormTypeView(formModel);
    this._renderControlsView(formModel);

    return this;
  },

  _renderFormTypeView: function (formModel) {
    var view = new AnalysisFormTypeView({
      formModel: formModel
    });

    this.addView(view);
    this.$el.append(view.render().el);
  },

  _renderControlsView: function (formModel) {
    var view = new AnalysisControlsView({
      formModel: formModel,
      analysisDefinitionNodesCollection: this._analysisDefinitionNodesCollection
    });
    this.addView(view);
    this.$el.append(view.render().el);
  }

});
