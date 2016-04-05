var cdb = require('cartodb.js-v3');
var template = require('./background-import-limit.tpl');

/**
 *  Import limit message within background importer
 *
 */

module.exports = cdb.core.View.extend({

  className: 'ImportItem ImportItem--sticky',
  tagName: 'li',

  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    this._userModel = opts.userModel;
  },

  render: function () {
    var importQuota = this._userModel.getMaxConcurrentImports();
    var isUpgradeable = !cdb.config.get('cartodb_com_hosted') && importQuota === 1;

    this.$el.html(
      template({
        upgradeUrl: window.upgrade_url,
        isUpgradeable: isUpgradeable,
        importQuota: importQuota
      })
    );

    return this;
  }

});
