var CoreView = require('backbone/core-view');
var nodeIds = require('../../../value-objects/analysis-node-ids');
var layerColors = require('../../../data/layer-colors');
var template = require('./default-layer-analysis-view.tpl');
var Analyses = require('../../../data/analyses');
var AnalysisTooltip = require('./analyses-tooltip-error');

/**
 * View for an analysis node with a single input
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer CDB-Text is-semibold CDB-Size-small js-analysis-node',
  initialize: function (opts) {
    if (!opts.layerDefinitionModel) throw new Error('layerDefinitionModel is required');
    if (!opts.analysisNode) throw new Error('analysisNode is required');

    this._layerDefinitionModel = opts.layerDefinitionModel;
    this._analysisNode = opts.analysisNode;

    this._analysisNode.on('change:status', this.render, this);
    this.add_related_model(this._analysisNode);

    AnalysisTooltip.track(this._analysisNode, this.$el, '.Editor-ListAnalysis-itemError');
  },

  render: function () {
    var status = this._analysisNode.get('status');

    this.$el.html(template({
      id: this.model.id,
      bgColor: this._bgColor(),
      isDone: status === 'ready' || status === 'failed',
      title: Analyses.title(this.model),
      hasError: status === 'failed'
    }));
    this.$el.toggleClass('has-error', status === 'failed');

    this.el.dataset.analysisNodeId = this.model.id;

    return this;
  },

  _bgColor: function () {
    var letter = nodeIds.letter(this._analysisNode.id);
    return layerColors.getColorForLetter(letter);
  },

  clean: function () {
    AnalysisTooltip.destroy();
    CoreView.prototype.clean.call(this);
  }
});
