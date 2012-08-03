
/**
 * dialog shown when a new column
 */
cdb.admin.NewColumnDialog= cdb.ui.common.Dialog.extend({

  initialize: function() {
    _.extend(this.options, {
      title: 'Add new Column',
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Create column",
      modal_type: "creation",
      width: 335,
      modal_class: 'new_column_dialog'
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    return this.getTemplate('table/views/new_column_dialog')();
  },

  // validate
  checkColumnName: function() {
    var s = this.$('input').val();
    if(s.trim() === '') {
      return false;
    }
    return true;
  },

  // create the column here
  ok: function() {
    if(this.checkColumnName()) {
      this.options.table.addColumn(this.$('input').val(), this.$('select').val());
    }
  }

});
