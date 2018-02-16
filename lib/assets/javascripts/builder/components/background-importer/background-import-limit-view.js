var CoreView = require('backbone/core-view');
var template = require('./background-import-limit.tpl');
var Notifier = require('builder/components/notifier/notifier');

/**
 *  Import limit message within background importer
 *
 */

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;

    this._notification = Notifier.addNotification({
      status: 'error',
      closable: true,
      button: false,
      info: this._getInfo()
    });

    this._initBinds();
  },

  _initBinds: function () {
    this._notification.on('notification:close', this._closeHandler, this);
    this.add_related_model(this._notification);
  },

  _closeHandler: function () {
    this.clean();
  },

  _getInfo: function () {
    var importQuota = this._userModel.getMaxConcurrentImports();
    var isUpgradeable = !this._configModel.get('cartodb_com_hosted') && importQuota === 1;

    return template({
      upgradeUrl: window.upgrade_url,
      isUpgradeable: isUpgradeable,
      importQuota: importQuota
    });
  }
});
