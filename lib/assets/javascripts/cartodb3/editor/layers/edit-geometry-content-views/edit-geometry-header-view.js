var CoreView = require('backbone/core-view');
var template = require('./edit-geometry-header.tpl');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.type) throw new Error('type is required');
    if (!opts.url) throw new Error('url is required');
    if (!opts.tableName) throw new Error('tableName is required');

    this._type = opts.type;
    this._url = opts.url;
    this._tableName = opts.tableName;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        url: this._url,
        tableName: this._tableName,
        type: this._type
      })
    );

    return this;
  },


});
