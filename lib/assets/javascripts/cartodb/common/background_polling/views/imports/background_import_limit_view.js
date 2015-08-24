var cdb = require('cartodb.js');

/**
 *  Import limit message within background importer
 *
 */

module.exports = cdb.core.View.extend({

  className: 'ImportItem ImportItem--sticky',
  tagName: 'li',

  initialize: function() {
    this.user = this.options.user;
    this.template = cdb.templates.getTemplate('common/background_polling/views/imports/background_import_limit');
  },

  render: function() {
    var userLimits = this.user.get('limits');
    var importQuota = ( userLimits && userLimits.concurrent_imports ) || 1;
    var isUpgradeable = !cdb.config.get('custom_com_hosted') && importQuota === 1;

    this.$el.html(
      this.template({
        upgradeUrl: window.upgrade_url,
        isUpgradeable: isUpgradeable,
        importQuota: importQuota
      })
    );

    return this;
  }

});
