var template = require('./default-layer-analysis-view.tpl');
var BaseLayerAnalysisView = require('./base-layer-analysis-view');
var AnalysisName = require('../analysis-name-map');

/**
 * View for an analysis node with a single input
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = BaseLayerAnalysisView.extend({
  options: {
    isDraggable: true
  },

  tagName: 'li',

  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer CDB-Text is-semibold CDB-Size-small js-analysis',

  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisNode) throw new Error('analysisNode is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisNode = opts.analysisNode;

    this.model.on('change', this.render, this);

    this._analysisNode.on('change:status', this.render, this);
    this.add_related_model(this._analysisNode);
  },

  render: function () {
    var status = this._analysisNode.get('status');

    this.$el.html(template({
      id: this.model.id,
      isDone: status === 'ready' || status === 'failed',
      title: AnalysisName(this.model.get('type'))
    }));

    this.$el.toggleClass('has-error', status === 'failed');

    if (this.options.isDraggable) {
      this._addDraggableHelper();
    }

    return this;
  }

});
