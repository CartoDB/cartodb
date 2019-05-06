var CoreView = require('backbone/core-view');
var template = require('./feedback-button.tpl');
var TipsyTooltipView = require('builder/components/tipsy-tooltip-view');

module.exports = CoreView.extend({

  tagName: 'a',
  className: 'EditorMenu-feedback typeform-share button js-feedback',

  attributes: {
    href: 'https://docs.google.com/forms/d/e/1FAIpQLScBQUWd-TP3Qy514DOCNg-KoLrViHijUR5giLAMS-3jmDnrPg/viewform',
    target: '_blank'
  },

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    if (!opts.modals) throw new Error('modals is required');
    this._modals = opts.modals;
  },

  render: function () {
    this.clearSubViews();

    this.$el.append(template());

    var tooltip = new TipsyTooltipView({
      el: this.el,
      gravity: 'w',
      title: function () {
        return _t('feedback');
      }
    });
    this.addView(tooltip);

    return this;
  },

  _onClick: function () {
    this.$el.blur();
  }
});
