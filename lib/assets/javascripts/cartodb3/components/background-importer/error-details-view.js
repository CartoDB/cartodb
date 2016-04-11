var cdb = require('cartodb.js-v3');

var error8001Template = require('./size-error-details-upgrade.tpl');
var error8005Template = require('./layers-error-details-upgrade.tpl');
var defaultTemplate = require('./error-details.tpl');

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = cdb.core.View.extend({

  _TEMPLATES: {
    8001: error8001Template,
    8005: error8005Template,
    default: defaultTemplate
  },

  initialize: function () {
    this.user = this.options.user;
    this.err = this.options.err;
  },

  render: function () {
    // Preventing problems checking if the error_code is a number or a string
    // we make the comparision with only double =.
    var errorCode = this.err.error_code && parseInt(this.err.error_code, 10);
    var upgradeUrl = cdb.config.get('upgrade_url');
    var userCanUpgrade = upgradeUrl && !cdb.config.get('cartodb_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgAdmin());
    var originalUrl = this.err.original_url;
    var httpResponseCode = this.err.http_response_code;
    var httpResponseCodeMessage = this.err.http_response_code_message;

    var template = this._getTemplate(errorCode, userCanUpgrade);

    var html = template({
      errorCode: errorCode,
      title: this.err.title,
      text: this.err.what_about,
      itemQueueId: this.err.item_queue_id,
      originalUrl: originalUrl,
      httpResponseCode: httpResponseCode,
      httpResponseCodeMessage: httpResponseCodeMessage,
      userCanUpgrade: userCanUpgrade,
      showTrial: this.user.canStartTrial(),
      upgradeUrl: upgradeUrl
    });

    this.$el.html(html);

    return this;
  },

  _getTemplate: function (templateName, userCanUpgrade) {
    var template = this._TEMPLATES['default'];

    if (userCanUpgrade && this._TEMPLATES[templateName]) {
      template = this._TEMPLATES[templateName];
    }
    return template;
  }
});
