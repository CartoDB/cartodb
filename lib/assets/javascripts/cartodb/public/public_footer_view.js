var cdb = require('cartodb.js-v3');

module.exports = cdb.core.View.extend({
  className: 'CDB-Text CDB-FontSize-medium u-tSpace-xl Footer',

  initialize: function () {
    this._initModels();

    this.template = this.isHosted
      ? cdb.templates.getTemplate('public/views/public_footer')
      : cdb.templates.getTemplate('common/views/footer_static');
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
    var DEFAULT_LIGHT_ACTIVE = false;
    // this.isHosted = cdb.config.get('cartodb_com_hosted');
    this.isHosted = true;
    this.onpremiseVersion = cdb.config.get('onpremise_version');
    this.light = !!this.options.light || DEFAULT_LIGHT_ACTIVE;
  }
});
