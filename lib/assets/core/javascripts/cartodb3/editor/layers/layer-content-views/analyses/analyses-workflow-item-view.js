var CoreView = require('backbone/core-view');
var template = require('./analyses-workflow-item.tpl');
var TipsyTooltipView = require('../../../../components/tipsy-tooltip-view');
var Analyses = require('../../../../data/analyses');
var NotificationErrorMessageHandler = require('../../notification-error-message-handler');
var nodeIds = require('../../../../value-objects/analysis-node-ids');
var layerColors = require('../../../../data/layer-colors');
var Router = require('../../../../routes/router');

module.exports = CoreView.extend({

  tagName: 'li',
  className: 'VerticalRadioList-item',

  events: {
    'click': '_onNodeClick'
  },

  initialize: function (opts) {
    if (!opts.analysisNode && !opts.formModel) throw new Error('analysisNode or formModel is required');

    this._isNew = !opts.analysisNode;
    this._analysisNode = opts.analysisNode || opts.formModel; // if form model represents a new node there is no analysis yet; use form model as fallback
    this._layerId = opts.layerId;
    this._selectedNodeId = opts.selectedNodeId;

    this.listenTo(this._analysisNode, 'change:status', this.render);
  },

  render: function () {
    var status = this._analysisNode.get('status');
    var isDone = this._isNew || status === 'ready' || status === 'failed';
    var isSelected = this._analysisNode.id === this._selectedNodeId;
    var hasFailed = status === 'failed';
    var tooltipMessage = this._tooltipMessage(hasFailed);
    var letter = nodeIds.letter(this._analysisNode.id);
    var bgColor = layerColors.getColorForLetter(letter);

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

    if (!this._isNew && !isSelected) {
      this._tooltip = new TipsyTooltipView({
        el: this.$('.js-tooltip'),
        className: hasFailed ? 'is-error' : '',
        gravity: 'w',
        title: function () {
          return tooltipMessage;
        }
      });
      this.addView(this._tooltip);
    }

    return this;
  },

  _onNodeClick: function () {
    Router.goToAnalysisNode(this._layerId, this._analysisNode.id);
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

    return _t('editor.layers.analysis-form.edit-analysis-tooltip');
  }
});
