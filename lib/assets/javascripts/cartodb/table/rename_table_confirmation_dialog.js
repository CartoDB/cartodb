
cdb.admin.RenameConfirmationDialog = cdb.admin.BaseDialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: "Rename this table",
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Ok, continue",
      cancel_button_classes: "underline margin15",
      modal_type: "confirmation",
      width: 510,
      modal_class: 'rename_table_confirmation_dialog'
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    return this.getTemplate('table/views/rename_table_confirmation')();
  },

  ok: function(ev) {
    var self = this;
    self.model.set({ name: self.options.newName }, {silent: true});
    self.model.save(null, {wait: true});
  }

});

