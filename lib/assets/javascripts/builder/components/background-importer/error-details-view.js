var _ = require('underscore');
var CoreView = require('backbone/core-view');
var defaultTemplate = require('./error-details.tpl');
var upgradeErrorTemplate = require('./upgrade-errors.tpl');
var UPGRADE_ERROR_CODES = [8001, 8002, 8005, 8007];

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = CoreView.extend({
  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.error) throw new Error('error is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._error = opts.error;
  },

  render: function () {
    var isUpgradeError = _.contains(UPGRADE_ERROR_CODES, this._error.errorCode);
    var upgradeUrl = this._configModel.get('upgrade_url');
    var userCanUpgrade = upgradeUrl && !this._configModel.get('cartodb_com_hosted') && (!this._userModel.isInsideOrg() || this._userModel.isOrgOwner());
    var template = this._getTemplate(isUpgradeError);

    var html = template({
      errorCode: this._error.errorCode,
      title: this._error.title,
      text: this._error.what_about,
      itemQueueId: this._error.item_queue_id,
      originalUrl: this._error.originalUrl,
      httpResponseCode: this._error.httpResponseCode,
      httpResponseCodeMessage: this._error.httpRresponseCodeMessage,
      userCanUpgrade: userCanUpgrade,
      showTrial: this._userModel.canStartTrial(),
      upgradeUrl: upgradeUrl
    });

    this.$el.html(html);

    return this;
  },

  _getTemplate: function (isUpgradeError) {
    var template = defaultTemplate;

    if (isUpgradeError) {
      template = upgradeErrorTemplate;
    }
    return template;
  }
});
