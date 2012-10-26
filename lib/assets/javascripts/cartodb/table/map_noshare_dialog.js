  /**
   * Shows a dialog wher you cannot share a map view
   * new NoShareMapDialog({
   *  table: table_model
   * })
   *
   */

  cdb.admin.NoShareMapDialog = cdb.admin.BaseDialog.extend({

    events: cdb.core.View.extendEvents({}),

    initialize: function() {
      var self = this;

      _.extend(this.options, {
        title: _t("We could not share your data"),
        description: '',
        template_name: 'common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey",
        ok_title: "Make it public",
        modal_type: "notification",
        width: 500,
        modal_class: 'no_share_table'
      });
      this.constructor.__super__.initialize.apply(this);
    },


    render_content: function() {
      var $content = this.$content = $("<div>")
        , temp_content = this.getTemplate('table/views/no_share_map_content');

      $content.append(temp_content);

      return $content;
    },

    ok: function() {
      this.options.table
        .set({ 'privacy': 'PUBLIC' })
        .save();
    }
  });
