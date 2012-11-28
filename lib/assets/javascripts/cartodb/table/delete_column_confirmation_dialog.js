
cdb.admin.DeleteColumnConfirmationDialog = cdb.admin.BaseDialog.extend({

  initialize: function(options) {
    _.extend(this.options, {
      title: "Delete ",
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      enter_to_confirm: true,
      ok_button_classes: "button grey",
      ok_title: "Ok, continue",
      cancel_button_classes: "underline margin15",
      modal_type: "confirmation",
      width: 510,
      modal_class: 'delete_column_confirmation_dialog'
    });
    this.options.title = 'Delete ' + this.options.column;
    this.globalError = this.options.globalError;
    _.bindAll(this, 'ok');
    this.constructor.__super__.initialize.apply(this);
    this.dfd = $.Deferred();
  },

  render_content: function() {
    return this.getTemplate('table/views/delete_column_confirmation')();
  },

  confirm: function() {
    return this.dfd.promise();
  },

  ok: function(ev) {
    this.dfd.resolve(this.options.column);
  }
});
