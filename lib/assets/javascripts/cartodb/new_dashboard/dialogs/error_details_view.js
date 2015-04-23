var $ = require('jquery');
var cdb = require('cartodb.js');
var BaseDialog = require('../../new_common/views/base_dialog/view');

/** 
 *  When an import fails, this dialog displays
 *  all the error info.
 *
 */

module.exports = BaseDialog.extend({

  className: 'Dialog ErrorDetails is-opening',

  initialize: function() {
    this.elder('initialize');
    this.user = this.options.user;
  },

  render_content: function() {
    var err = this.model.getError();
    var sizeError = err.error_code && err.error_code == "8001";
    var userCanUpgrade = !cdb.config.get('custom_com_hosted') && (!this.user.isInsideOrg() || this.user.isOrgAdmin());

    this.template = cdb.templates.getTemplate(
      sizeError && userCanUpgrade ?
        'new_dashboard/views/error_details_upgrade' : 
        'new_dashboard/views/error_details' 
    )

    var d = {
      sizeError: sizeError,
      errorCode: err.error_code,
      title: err.title,
      text: err.what_about,
      itemQueueId: err.item_queue_id,
      userCanUpgrade: userCanUpgrade,
      showTrial: this.user.canStartTrial(),
      upgradeUrl: window.upgrade_url
    };

    return this.template(d);
  }

})