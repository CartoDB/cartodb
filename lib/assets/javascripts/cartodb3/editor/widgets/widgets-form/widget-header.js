var CoreView = require('backbone/core-view');
var template = require('./widget-header.tpl');

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.title) throw new Error('title is required');

    this._title = opts.title;
  },

  render: function () {
    this.$el.html(
      template({
        title: this._title
      })
    );
    return this;
  }
});
