var CoreView = require('backbone/core-view');
var template = require('./custom-list-action.tpl');

module.exports = CoreView.extend({

  className: 'CDB-Text CDB-Size-small is-semibold u-upperCase u-actionTextColor u-lSpace--xl',

  tagName: 'button',

  events: {
    'click': '_onClick'
  },

  initialize: function (opts) {
    this.options = opts;
  },

  render: function () {
    this.$el.empty();
    this.clearSubViews();

    this.$el.append(template({
      label: this.options.label
    }));

    return this;
  },

  _onClick: function () {
    this.options.action && this.options.action();
  }
});
