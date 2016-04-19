var cdb = require('cartodb-deep-insights.js');
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
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
  },

  render: function () {
    var importQuota = this._userModel.getMaxConcurrentImports();
    var isUpgradeable = !this._configModel.get('cartodb_com_hosted') && importQuota === 1;

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
