var BaseDialog = require('new_common/views/base_dialog/view');

/**
 * Delete items dialog
 */
module.exports = BaseDialog.extend({

  /**
   * @implements cdb.ui.common.Dialog.prototype.render_content
   */
  render_content: function() {
    return "hello world";
  }
});
