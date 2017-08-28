var cdb = require('cartodb.js-v3');

/**
 *  Decide what support block app should show
 *
 */

module.exports = cdb.core.View.extend({
  initialize: function () {
    this.template = cdb.templates.getTemplate('common/views/footer');
  },

  render: function () {
    this.$el.html(
      this.template({
        onpremiseVersion: cdb.config.get('onpremise_version'),
        isHosted: cdb.config.get('cartodb_com_hosted')
      })
    );

    return this;
  }
});
