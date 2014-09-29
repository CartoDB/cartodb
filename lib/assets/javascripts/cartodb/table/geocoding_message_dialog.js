
  /**
   *  Geocoder message dialog
   *
   *  - It will be displayed when geocoder task is finished.
   *  - Back up from old geocoding dialog.
   *
   */

  cdb.admin.GeocodingMessageDialog = cdb.admin.BaseDialog.extend({

    initialize: function(options) {
      _.extend(this.options, {
        template_name: 'table/views/geocoding_message_dialog_base',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "button grey",
        ok_title: "Continue",
        cancel_button_classes: "underline margin15",
        style: options.style || "point",
        width: 512,
        modal_class: 'geocoding_message_dialog'
      });

      this.constructor.__super__.initialize.apply(this);
    },

    animate: function() {
      this.$(".opt").addClass("animated selected");
    },

    render_content: function() {
      return this.getTemplate('table/views/geocoding_message_dialog_content')(this.options);
    }
  });

