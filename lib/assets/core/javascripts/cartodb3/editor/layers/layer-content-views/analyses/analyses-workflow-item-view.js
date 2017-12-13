var $ = require('jquery');
var CoreView = require('backbone/core-view');
var template = require('./analyses-workflow-item.tpl');
var nodeIds = require('../../../../value-objects/analysis-node-ids');
var layerColors = require('../../../../data/layer-colors');
var TipsyTooltipView = require('../../../../components/tipsy-tooltip-view');
var Analyses = require('../../../../data/analyses');
var NotificationErrorMessageHandler = require('../../notification-error-message-handler');

module.exports = CoreView.extend({

  tagName: 'li',
  className: 'VerticalRadioList-item',

  events: {
    'click': '_onNodeClick'
  },

  initialize: function (opts) {
    if (!opts.analysisNode && !opts.formModel) throw new Error('analysisNode or formModel is required');
    if (!opts.viewModel) throw new Error('viewModel is required');

    this._isNew = !opts.analysisNode;
    this._analysisNode = opts.analysisNode || opts.formModel; // if form model represents a new node there is no analysis yet; use form model as fallback
    this._viewModel = opts.viewModel;

    this._analysisNode.on('change:status', this.render, this);
    this.add_related_model(this._analysisNode);
  },

  render: function () {
    var status = this._analysisNode.get('status');
    var isDone = this._isNew || status === 'ready' || status === 'failed';
    var isSelected = this._analysisNode.id === this._viewModel.get('selectedNodeId');
    var letter = nodeIds.letter(this._analysisNode.id);
    var bgColor = layerColors.getColorForLetter(letter);
    var hasFailed = status === 'failed';
    var tooltipMessage = this._tooltipMessage(hasFailed);
    var self = this;

    this.clearSubViews();
    this.$el.html(
      template({
        isNew: this._isNew,
        isDone: isDone,
        bgColor: bgColor,
        isSelected: isSelected,
        nodeId: this._analysisNode.id,
        hasError: hasFailed,
        name: this._analysisName()
      })
    );

    this._tooltip = new TipsyTooltipView({
      el: this.$el,
      className: hasFailed ? 'is-error' : '',
      gravity: 'w',
      offset: this._getTipsyOffset(),
      title: function () {
        return tooltipMessage;
      },
      mouseEnterAction: function () {
        this.setOffset(self._getTipsyOffset());
      }
    });
    this.addView(this._tooltip);

    return this;
  },

  _onNodeClick: function () {
    this._viewModel.set('selectedNodeId', this._analysisNode.id);
  },

  _analysisName: function () {
    return Analyses.title(this._analysisNode.get('type') || '');
  },

  _tooltipMessage: function (hasFailed) {
    if (hasFailed) {
      var error = this._analysisNode.get('error');
      var errorMessage = error && error.message && NotificationErrorMessageHandler.extractError(error.message).message;

      return errorMessage;
    }

    return _t('editor.layers.analysis-form.edit-analysis-tooltip', { name: this._analysisName() });
  },

  _getTipsyOffset: function () {
    var $element = $(this.$el);
    var total = 0;
    var offset = 8;

    $element.children().each(function (index, child) {
      total += $(child).outerWidth(true);
    });

    return total - $element.width() + offset;
  }
});
