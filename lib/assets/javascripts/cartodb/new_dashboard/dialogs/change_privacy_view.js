var cdb = require('cartodb.js');
var BaseDialog = require('new_common/views/base_dialog/view');
var _ = require('underscore');

/**
 * Change privacy datasets/maps dialog.
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');
    this.template = cdb.templates.getTemplate('new_dashboard/dialogs/change_privacy_template');
    this.item = this.options.item; // of model cdb.admin.Visualization
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return this.template({
      itemName: this.item.get('name')
    });
  },
  
  cancel: function() {
    this.clean();
  }
});
