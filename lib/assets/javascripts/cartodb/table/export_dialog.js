
/**
 * shows a dialog to get the table exported
 * new ExportTableDialog({
 *  table: table_model
 * })
 * 
 */
cdb.admin.ExportTableDialog = cdb.admin.BaseDialog.extend({

  events: cdb.core.View.extendEvents({
      'click': 'hide'
  }),

  initialize: function() {
    _.extend(this.options, {
      title: "Export",
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "",
      modal_type: "",
      width: 445,
      modal_class: 'export_table_dialog',
      include_footer: false,
      table_id: this.model.id
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    return this.getTemplate('table/views/export_table_dialog')();
  }

});
