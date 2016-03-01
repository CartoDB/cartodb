var cdb = require('cartodb.js');
var template = require('./editor-header.tpl');

module.exports = cdb.core.View.extend({
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
