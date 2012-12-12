  /**
   * Shows a dialog to start merging two tables
   *  new MergeTablesDialog({
   *    model: table
   *  })
   *
   */

  cdb.admin.MergeTablesDialog = cdb.admin.BaseDialog.extend({

    // events: {
    //   "keydown input":    "_checkEnter",
    //   "focusin input":    "_focusIn",
    //   "focusout input":   "_focusOut",
    //   "click .ok.button": "ok",
    //   "click .cancel":    "_cancel",
    //   "click .close":     "_cancel"
    // },

    initialize: function() {

      //_.bindAll(this, "_checkTileJson", "_successChooser", "_errorChooser", "_showLoader", "_hideLoader");

      var self = this;

      _.extend(this.options, {
        template_name: 'table/views/merge_tables_dialog_base',
        title: _t("Merge with another table"),
        description: _t(""),
        clean_on_hide: true,
        cancel_button_classes: "margin15",
        ok_button_classes: "button disabled grey",
        ok_title: _t("Merge tables"),
        modal_type: "creation",
        width: 633,
        modal_class: 'merge_tables_dialog'
      });

      this.constructor.__super__.initialize.apply(this);

      // this.enable = true;
      // this.tilejson = null;
    },


    render_content: function() {
      return this.getTemplate('table/views/merge_tables_content')();
    }

  });
