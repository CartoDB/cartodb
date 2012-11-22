
cdb.admin.RenameConfirmationDialog = cdb.admin.BaseDialog.extend({

  initialize: function(options) {
    _.extend(this.options, {
      title: "Rename this table",
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "button grey",
      ok_title: "Ok, continue",
      cancel_button_classes: "underline margin15",
      modal_type: "confirmation",
      width: 510,
      modal_class: 'rename_table_confirmation_dialog'
    });
    this.globalError = this.options.globalError;
    _.bindAll(this, 'ok');
    this.constructor.__super__.initialize.apply(this);
    this.dfd = $.Deferred();
  },

  render_content: function() {
    return this.getTemplate('table/views/rename_table_confirmation')();
  },

  confirm: function() {
    return this.dfd.promise();
  },

  ok: function(ev) {
    this.dfd.resolve(this.options.newName);
  }
});
