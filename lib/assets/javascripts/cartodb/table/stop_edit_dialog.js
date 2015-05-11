
cdb.admin.StopEditDialog = cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: 'Sorry, this geometry is too big to edit in browser',
      template_name: 'old_common/views/dialog_base',
      clean_on_hide: true,
      cancel_button_classes: "hide",
      ok_button_classes: "button grey",
      ok_title: "Hide",
      modal_type: "confirmation",
      width: 510
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    return this.getTemplate('table/views/stop_edit_confirmation')();
  }
});