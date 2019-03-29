var Backbone = require('backbone');
var CoreView = require('backbone/core-view');
var nodeIds = require('builder/value-objects/analysis-node-ids');
var layerColors = require('builder/data/layer-colors');
var template = require('./default-layer-analysis-view.tpl');
var Analyses = require('builder/data/analyses');
var AnalysisTooltip = require('./analyses-tooltip-error');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

/**
 * View for an analysis node with a single input
 *
 * this.model is expected to be a analysis-definition-node-nodel
 */
module.exports = CoreView.extend({

  tagName: 'li',
  className: 'Editor-ListAnalysis-item Editor-ListAnalysis-layer CDB-Text is-semibold CDB-Size-small js-analysis-node',

  events: {
    'mouseenter': '_onMouseEnter',
    'mouseleave': '_onMouseLeave'
  },

  initialize: function (opts) {
    if (!opts.analysisNode) throw new Error('analysisNode is required');

    this._analysisNode = opts.analysisNode;
    this._analysisNode.on('change:status', this.render, this);
    this.add_related_model(this._analysisNode);

    this._analysisTooltip = new AnalysisTooltip({
      analysisNode: this._analysisNode,
      element: this.$el,
      triggerSelector: '.Editor-ListAnalysis-itemError'
    });
    this.addView(this._analysisTooltip);

    this._stateModel = new Backbone.Model({
      highlighted: false
    });

    this._initBinds();
  },

  _initBinds: function () {
    this._stateModel.on('change:highlighted', this._toggleHover, this);
    this.add_related_model(this._stateModel);
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

    this._initViews();

    return this;
  },

  _initViews: function () {
    var sourceTooltip = new TipsyTooltipView({
      el: this.$el,
      gravity: 'w',
      title: function () {
        return _t('edit-analysis');
      }
    });
    this.addView(sourceTooltip);
  },

  _bgColor: function () {
    var letter = nodeIds.letter(this._analysisNode.id);
    return layerColors.getColorForLetter(letter);
  },

  _onMouseEnter: function () {
    this._stateModel.set('highlighted', true);
  },

  _onMouseLeave: function () {
    this._stateModel.set('highlighted', false);
  },

  _toggleHover: function () {
    var $layer = this.$el.closest('.js-layer');
    var $title = $layer.find('.js-Editor-ListLayer-titleText');
    var highlighted = this._stateModel.get('highlighted');

    $layer.toggleClass('is-hover', highlighted);
    $title.toggleClass('is-hover', highlighted);
  }
});
