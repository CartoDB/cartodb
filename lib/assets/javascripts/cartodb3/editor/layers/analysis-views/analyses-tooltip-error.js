var $ = require('jquery');
var TipsyTooltipView = require('../../../components/tipsy-tooltip-view.js');

var AnalysisTooltip = {
  track: function (analysisNode, element, triggerSelector) {
    this.$el = element;
    this.selector = triggerSelector;
    this.analysisNode = analysisNode;

    this.$el.on('mouseover', this.selector, this.showTooltip.bind(this));
    this.$el.on('mouseout', this.selector, this.destroyTooltip.bind(this));
    this.$el.on('mouseleave', this.selector, this.destroyTooltip.bind(this));
  },

  destroy: function () {
    this.$el.off('mouseover', this.selector);
    this.$el.off('mouseout', this.selector);
    this.$el.off('mouseleave', this.selector);
    this.destroyTooltip();
  },

  showTooltip: function (e) {
    var status = this.analysisNode.get('status');
    var error = this.analysisNode.get('error');
    var message;
    var $el;

    if (status === 'failed') {
      message = _t('notifications.analysis.failed', {
        nodeId: this.analysisNode.get('id').toUpperCase()
      });

      if (error && error.message) {
        message += ': ' + error.message;
      }

      $el = $(e.target);

      this.tooltip = this.createTooltip({
        $el: $el,
        msg: message
      });

      this.tooltip.showTipsy();
    }
  },

  createTooltip: function (opts) {
    return new TipsyTooltipView({
      el: opts.$el,
      title: function () {
        return opts.msg;
      }
    });
  },

  destroyTooltip: function () {
    if (this.tooltip) {
      this.tooltip.hideTipsy();
      this.tooltip.destroyTipsy();
    }
  }
};

module.exports = AnalysisTooltip;
