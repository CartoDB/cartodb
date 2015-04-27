var BaseDialog = require('../../views/base_dialog/view');

/**
 * Delete items dialog
 */
module.exports = BaseDialog.extend({

  initialize: function() {
    this.elder('initialize');
    if (!this.options.publishOptions) throw new Error('publishOptions is compulsory');
  },

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return cdb.templates.getTemplate('new_common/dialogs/publish/publish')({
    });
  }

});
