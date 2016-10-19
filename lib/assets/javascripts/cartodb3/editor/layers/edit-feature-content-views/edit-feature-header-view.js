var CoreView = require('backbone/core-view');
var template = require('./edit-feature-header.tpl');

module.exports = CoreView.extend({

  initialize: function (opts) {
    if (!opts.url) throw new Error('url is required');
    if (!opts.tableName) throw new Error('tableName is required');

    this._url = opts.url;
    this._tableName = opts.tableName;
  },

  render: function () {
    this.clearSubViews();

    this.$el.html(
      template({
        url: this._url,
        tableName: this._tableName,
        type: this.model._getFeatureType()
      })
    );

    return this;
  }

});
