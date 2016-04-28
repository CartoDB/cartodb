var cdb = require('cartodb.js-v3');
var defaultTemplate = require('./error-details.tpl');
var upgradeErrorTemplate = require('./upgrade-errors.tpl');

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = cdb.core.View.extend({
  initialize: function (opts) {
    if (!opts.userModel) throw new Error('userModel is required');
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.error) throw new Error('error is required');

    this._userModel = opts.userModel;
    this._configModel = opts.configModel;
    this._error = opts.error;
  },

  render: function () {
    // Preventing problems checking if the error_code is a number or a string
    // we make the comparision with only double =.
    var errorCode = this._error.errorCode && parseInt(this._error.errorCode, 10);
    var upgradeUrl = this._configModel.get('upgrade_url');
    var userCanUpgrade = upgradeUrl && !this._configModel.get('cartodb_com_hosted') && (!this._userModel.isInsideOrg() || this._userModel.isOrgAdmin());
    var template = this._getTemplate(userCanUpgrade);

    var html = template({
      errorCode: errorCode,
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

  _getTemplate: function (userCanUpgrade) {
    var template = defaultTemplate;

    if (userCanUpgrade) {
      template = upgradeErrorTemplate;
    }
    return template;
  }
});
