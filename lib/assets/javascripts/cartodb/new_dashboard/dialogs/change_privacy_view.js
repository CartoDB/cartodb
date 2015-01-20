var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var _ = require('underscore');
var PrivacyOptions = require('./change_privacy/options_collection');

/**
 * Change privacy datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy/template');
    this.vis = this.options.vis; // of model cdb.admin.Visualization
    this.user = this.options.user;
    this.privacyOptions = PrivacyOptions.byVisAndUser(this.vis, this.user);
    
    this.add_related_model(this.user);
    this.add_related_model(this.vis);
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return this.template({
      itemName: this.vis.get('name'),
      privacyOptions: this.privacyOptions
    });
  },
  
  cancel: function() {
    this.clean();
  }
});
