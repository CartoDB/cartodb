var template = require('./default-layer-analysis-view.tpl');

/**
 * View for an analysis node with a single input
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = cdb.core.View.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.layerAnalysisViewFactory) throw new Error('layerAnalysisViewFactory is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._layerAnalysisViewFactory = opts.layerAnalysisViewFactory;

    this.model.on('change', this.render, this);
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(template({
      id: this.model.id,
      title: this.model.get('type')
    }));

    var view = this._layerAnalysisViewFactory.createView(this.model.sourceIds()[0], this._layerDefinitionModel);
    this.addView(view);
    this.$el.append(view.render().el);

    return this;
  }
});
