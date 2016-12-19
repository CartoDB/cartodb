var CoreView = require('backbone/core-view');
var template = require('./apply-button.tpl');

module.exports = CoreView.extend({
  events: {
    'click .js-apply': '_onApplyClick'
  },

  initialize: function (opts) {
    if (!opts.onApplyClick) throw new Error('onApplyClick is required');
  },

  render: function () {
    this.$el.html(template());
    return this;
  },

  _onApplyClick: function () {
    this.options.onApplyClick();
  }
});
