var cdb = require('cartodb.js');

/**
 * Error details view, to be used together with an error object from an import model.
 *
 */

module.exports = cdb.core.View.extend({

  _TEMPLATES: {
    8001: 'common/views/size_error_details_upgrade_template',
    8005: 'common/views/layers_error_details_upgrade_template',
    default: 'common/views/error_details'
  },

  initialize: function() {
    this.user = this.options.user;
    this.err = this.options.err;
  },

  render: function() {
    // Preventing problems checking if the error_code is a number or a string
    // we make the comparision with only double =.
    var errorCode = this.err.error_code && parseInt(this.err.error_code);
    var upgradeUrl = cdb.config.get('upgrade_url');
    var userCanUpgrade = upgradeUrl && !cdb.config.get('custom_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgAdmin());
    var templatePath = this._TEMPLATES['default'];
    var originalUrl = this.err.original_url;
    var state = this.err.state;
    var contentGuessing = this.err.content_guessing;
    var typeGuessing = this.err.type_guessing;
    var server = this.err.server;
    var serviceName = this.err.service_name;
    var host = this.err.host;
    var uploadHost = this.err.upload_host;
    var resquePpid = this.err.resque_ppid;
    var dataType = this.err.data_type;

    if (userCanUpgrade && this._TEMPLATES[errorCode]) {
      templatePath = this._TEMPLATES[errorCode];
    }

    var template = cdb.templates.getTemplate(templatePath);

    this.$el.html(
      template({
        errorCode: errorCode,
        title: this.err.title,
        text: this.err.what_about,
        itemQueueId: this.err.item_queue_id,
        originalUrl: originalUrl,
        contentGuessing: contentGuessing,
        typeGuessing: typeGuessing,
        server: server,
        serviceName: serviceName,
        host: host,
        uploadHost: uploadHost,
        resquePpid: resquePpid,
        dataType: dataType,
        state: state,
        userCanUpgrade: userCanUpgrade,
        showTrial: this.user.canStartTrial(),
        upgradeUrl: upgradeUrl
      })
    );

    return this;
  }

});
