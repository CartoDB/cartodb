var cdb = require('cartodb.js');
var template = require('./header.tpl');

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.title) throw new Error('title is required');

    this._title = opts.title;
    this._canGoBack = opts.canGoBack;
  },

  render: function () {
    this.$el.html(
      template({
        title: this._title,
        canGoBack: this._canGoBack
      })
    );
    return this;
  }
});
