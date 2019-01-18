var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');
var Browsers = require('../helpers/browsers');

module.exports = cdb.core.View.extend({
  id: 'not_supported_dialog',

  initialize: function () {
    this.template = cdb.templates.getTemplate('embed_map/views/embed_map_browsers');
    this.isVisible = _.filter(Browsers, function (browser) {
      return navigator.userAgent.indexOf(browser.name) !== -1;
    }).length === 0;
  },

  render: function () {
    this.$el.empty();
    this._initViews();
    return this;
  },

  _initViews: function () {
    this.$el.toggle(this.isVisible).html(this.template());
  }
});
