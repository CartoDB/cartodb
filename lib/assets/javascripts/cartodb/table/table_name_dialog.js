
/**
 * dialog shown when duplicate or export a query to ask for new name
 */
cdb.admin.TableNameDialog= cdb.ui.common.Dialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: 'Table name',
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Create",
      modal_type: "creation",
      width: 335,
      modal_class: 'new_column_dialog'
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    return this.getTemplate('table/views/new_table_name_dialog')();
  },

  ok: function() {
    var name = this.$('input').val();
    if(name && name.length) {
      this.options.ok && this.options.ok(name);
    }
  }
});
