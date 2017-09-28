var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('public/views/public_navigation');
    this._initModels();
  },

  render: function () {
    this.clearSubViews();
    this.$el.html(this.template());
    return this;
  },

  _initModels: function () {},

  _renderLogoLink: function () {}
});
