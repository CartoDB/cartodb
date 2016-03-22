var cdb = require('cartodb-deep-insights.js');
var template = require('./ref-layer-analysis-view.tpl');
var LayerAnalysisDraggableHelperView = require('../layer-analysis-draggable-helper-view');
var BaseLayerAnalysisView = require('./base-layer-analysis-view');

/**
 * Reference to another layer.
 * this.model is a layer-definition-model
 */
module.exports = BaseLayerAnalysisView.extend({

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      letter: this.model.get('letter'),
      title: this.model.getName()
    }));

    this.draggableHelperView = new LayerAnalysisDraggableHelperView({
      el: this.el
    });

    this.addView(this.draggableHelperView);
    this.draggableHelperView.bind('dropped', this._onDropped, this);

    return this;
  },

  _onDropped: function () {
    console.log('TODO: creates a new layer from ' + this.model.toJSON()); // TODO: replace with actual layer generation
  }

});
