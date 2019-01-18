var cdb = require('cartodb.js-v3');

var DEFAULT_LIGHT_ACTIVE = false;

module.exports = cdb.core.View.extend({
  initialize: function () {
    this._initModels();

    this.template = this.isHosted
      ? cdb.templates.getTemplate('common/views/footer_static')
      : cdb.templates.getTemplate('public/views/public_footer');
  },

  render: function () {
    this.$el.html(
      this.template({
        isHosted: this.isHosted,
        light: this.light,
        onpremiseVersion: this.onpremiseVersion
      })
    );

    return this;
  },

  _initModels: function () {
    this.isHosted = cdb.config.get('cartodb_com_hosted');
    this.onpremiseVersion = cdb.config.get('onpremise_version');
    this.light = !!this.options.light || DEFAULT_LIGHT_ACTIVE;
  }
});
