
  /**
   *  Delete visualization dialog
   */

  cdb.admin.DeleteVisualizationDialog = cdb.admin.BaseDialog.extend({

    initialize: function(options) {
      _.extend(this.options, {
        title: "Delete this visualization",
        template_name: 'common/views/dialog_base',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "button grey",
        ok_title: "Delete this visualization",
        cancel_button_classes: "underline margin15",
        modal_type: "confirmation",
        width: 510,
        modal_class: 'delete_dialog'
      });

      this.constructor.__super__.initialize.apply(this);
    },

    render_content: function() {
      return this.getTemplate('common/views/delete_visualization_dialog')();
    }
  });