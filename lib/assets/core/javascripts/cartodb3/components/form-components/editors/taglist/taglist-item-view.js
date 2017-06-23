var CoreView = require('backbone/core-view');

module.exports = CoreView.extend({
  tagName: 'li',

  initialize: function (opts) {
    if (!opts.label) throw new Error('label is required');
    this._label = opts.label;
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this._label);
    return this;
  }
});
