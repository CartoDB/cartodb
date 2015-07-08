var cdb = require('cartodb.js');

/**
 * Error details view, to be used together with an error object from an import model.
 */
module.exports = cdb.core.View.extend({

  initialize: function() {
    this.user = this.options.user;
    this.err = this.options.err;
  },

  render: function() {
    // Preventing problems checking if the error_code is a number or a string
    // we make the comparision with only double =.
    var sizeError = this.err.error_code && this.err.error_code == '8001';
    var userCanUpgrade = !cdb.config.get('custom_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgAdmin());

    var template = cdb.templates.getTemplate(
      sizeError && userCanUpgrade ? 'common/views/error_details_upgrade' : 'common/views/error_details'
    );

    this.$el.html(
      template({
        sizeError: sizeError,
        errorCode: this.err.error_code,
        title: this.err.title,
        text: this.err.what_about,
        itemQueueId: this.err.item_queue_id,
        userCanUpgrade: userCanUpgrade,
        showTrial: this.user.canStartTrial(),
        upgradeUrl: cdb.config.get('upgrade_url')
      })
    );

    return this;
  }

});
