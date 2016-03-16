var template = require('./composite-layer-analysis-view.tpl');

/**
 * View for an analysis node which have two source nodes as input.
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

    this.$el.html(template());

    var sourceIds = this.model.sourceIds();

    var view = this._layerAnalysisViewFactory.createView(sourceIds[0], this._layerDefinitionModel);
    this.addView(view);
    this.$('.js-primary-source').append(view.render().el);

    view = this._layerAnalysisViewFactory.createView(sourceIds[1], this._layerDefinitionModel);
    this.addView(view);
    this.$('.js-secondary-source').append(view.render().el);

    return this;
  }

});
