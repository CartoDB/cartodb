
  /**
   *  Geocoder modal window. Prenvets user to make it work
   *  twice at the same time.
   */

  cdb.admin.GeocoderWorking = cdb.admin.BaseDialog.extend({
    _TEXTS: {
      georeference: {
        title:        _t('Geocoder is already running'),
        description:  _t('If you want to georeference using another pattern, please cancel the current \
                          one (at the right bottom of your screen) and start again the process.'),
        ok:           _t('Close')
      }
    },

    initialize: function(options) {
      var self = this;
      _.extend(this.options, {
        title: self._TEXTS.georeference.title,
        descriptionSafeHtml: self._TEXTS.georeference.description,
        template_name: 'old_common/views/confirm_dialog',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "right button grey",
        ok_title: self._TEXTS.georeference.ok,
        cancel_button_classes: "hide",
        modal_type: "confirmation",
        width: 500
      });

      this.constructor.__super__.initialize.apply(this);
    }

  });
