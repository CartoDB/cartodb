var cdb = require('cartodb.js');
var AnalysisTypeMap = require('./analyses-form-types/analysis-form-type-options');

module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('Layer definition is required');
    if (!opts.viewModel) throw new Error('viewModel is required');

    this.layerDefinitionModel = opts.layerDefinitionModel;
    this.viewModel = opts.viewModel;

    this._initBinds();
  },

  render: function () {
    this.clearSubViews();
    this.$el.empty();

    var m = this.viewModel.get('selectedNode');
    var FormViewKlass = AnalysisTypeMap.getFormView(m.get('type'));
    var formView = new FormViewKlass({
      analysisDefinitionNodeModel: m,
      layerDefinitionModel: this.layerDefinitionModel
    });

    this.addView(formView);
    this.$el.append(formView.render().el);

    return this;
  },

  _initBinds: function () {
    this.viewModel.bind('change:selectedNode', this.render, this);
    this.add_related_model(this.viewModel);
  }
});
