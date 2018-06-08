var $ = require('jquery');
var cdb = require('internal-carto.js');
var CoreView = require('backbone/core-view');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view.js');
var NotificationErrorMessageHandler = require('builder/editor/layers/notification-error-message-handler');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.analysisNode) throw new Error('analysisNode is required');
    if (!opts.element) throw new Error('element is required');
    if (!opts.triggerSelector) throw new Error('triggerSelector is required');

    this.analysisNode = opts.analysisNode;
    this.$el = opts.element;
    this.selector = opts.triggerSelector;

    this.$el.on('mouseover', this.selector, this._showTooltip.bind(this));
    this.$el.on('mouseout', this.selector, this._destroyTooltip.bind(this));
    this.$el.on('mouseleave', this.selector, this._destroyTooltip.bind(this));
  },

  _showTooltip: function (e) {
    var status = this.analysisNode.get('status');

    if (status === 'failed') {
      var message = NotificationErrorMessageHandler.extractErrorFromAnalysisNode(this.analysisNode);

      this.tooltip = this._createTooltip({
        $el: $(e.target),
        msg: message.message
      });

      this.tooltip.showTipsy();
    }
  },

  _createTooltip: function (opts) {
    return new TipsyTooltipView({
      el: opts.$el,
      title: function () {
        return opts.msg;
      }
    });
  },

  _destroyTooltip: function () {
    if (this.tooltip) {
      this.tooltip.hideTipsy();
      this.tooltip.destroyTipsy();
      delete this.tooltip;
    }
  },

  clean: function () {
    this.$el.off('mouseover', this.selector);
    this.$el.off('mouseout', this.selector);
    this.$el.off('mouseleave', this.selector);

    this._destroyTooltip();
    cdb.core.View.prototype.clean.call(this);
  }
});
