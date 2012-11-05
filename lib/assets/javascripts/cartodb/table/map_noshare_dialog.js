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

    _ok: function(ev) {
      var self = this;

      if(ev) ev.preventDefault();

      this.options.table
        .save({ 'privacy': 'PUBLIC' });

      this.$el.find(".modal").animate({
        marginTop: -150,
        opacity: 0
      },250);
    
      setTimeout(function(){
        self._showShareDialog();
      },200);
    },

    _showShareDialog: function() {
      // Create the share_dlg
      var share_dlg = new cdb.admin.ShareMapDialog({
        map: this.options.map,
        table: this.options.table
      });

      // Hide no-share-dialog and show the share-dialog
      share_dlg.appendToBody();
      share_dlg.open({ center: true });

      this.$el.remove()
      this.clean();
    }
  });
