var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('show/views/private_header');

    this._initModels();
  },

  render: function () {
    this.$el.html(this.template({
      cartoLogoImagePath: 'layout/carto-logo.svg',
      currentUser: this.currentUser,
      isHosted: cdb.config.get('cartodb_com_hosted')
    }));

    return this;
  },

  _initModels: function () {
    this.currentUser = this.options.currentUser;
    this.vizdata = this.options.vizdata;
  }
});
