
/**
 * Delete confirmation window (extends Dialog)
 *
 * When you need to delete a table, it needs a confirmation
 *
 * Usage example:
 *
    var delete_dialog = new cdb.admin.DeleteDialog({
      model: table_model
    });
 *
 */

cdb.admin.DeleteDialog = cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: "You are about to delete this table",
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Delete this table",
      cancel_button_classes: "underline margin15",
      modal_type: "confirmation",
      width: 510,
      modal_class: 'delete_table_dialog'
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    return this.getTemplate('common/views/delete_table_dialog')();
  },

  ok: function(ev) {
    var self = this;
    this.model.destroy({
      success: function() {
        self.options.ok && self.options.ok();
      }
    });
  }

});
