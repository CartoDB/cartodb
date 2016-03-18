var template = require('./default-layer-analysis-view.tpl');
var LayerAnalysisDraggableHelperView = require('../layer-analysis-draggable-helper-view');

/**
 * View for an analysis node with a single input
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = cdb.core.View.extend({

  tagName: 'li',

  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer CDB-Text is-semibold CDB-Size-small js-analysis',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this.model.on('change', this.render, this);
  },

  render: function () {
    this.$el.html(template({
      id: this.model.id,
      title: this.model.get('type')
    }));

    this.draggableHelperView = new LayerAnalysisDraggableHelperView({
      el: this.el
    });

    this.addView(this.draggableHelperView);
    this.draggableHelperView.bind('dropped', this._onDropped, this);

    return this;
  },

  _onDropped: function () {
    console.log(this.model.toJSON()); // TODO: replace with actual layer generation
  }

});
