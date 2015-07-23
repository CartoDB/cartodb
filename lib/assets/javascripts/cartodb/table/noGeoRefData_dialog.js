
/**
 *  No georeference data dialog appears when there is no data or data georeferenced
 *
 *  var dlg = new cdb.admin.NoGeoRefDataDialog({
 *    model: table_model,
 *    geocoder: geocoder
 *  })
 *
 */

cdb.admin.NoGeoRefDataDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title:      _t('No georeferenced data on your layer'),
    content:    _t('Although we can see you have data, it does not \
                appear to be georeferenced. You will not see anything on the map if \
                your records are not georeferenced. Click on Georeference if you want \
                to use a geocoder to get location out of your data, or cancel.'),
    georef:     _t('Georeference'),
    cancel:     _t('Cancel')
  },

  initialize: function(options) {
    _.extend(this.options, {
      title: this._TEXTS.title,
      content_classes: "grey",
      content: '',
      template_name: 'table/views/noGeoRef_dialog',
      clean_on_hide: true,
      hasContent: false,
      ok_button_classes: "button grey",
      cancel_button_classes: "enabled",
      cancel_title: this._TEXTS.cancel,
      modal_type: "noGeoRef",
      width: 525,
      error_messages: {}
    });

    this.user = this.options.user;

    this.elder('initialize');
  },

  /**
   * Render the content for the create dialog
   */
  render_content: function() {
    this.hasContent = (this.model._data.length  > 0);
    this.$('a.ok').text(this._TEXTS.georef);

    return this._TEXTS.content;
  },

  ok: function() {
    if (this.hasContent) {
      var newModals = this.user.featureEnabled('new_modals');
      var dlg;
      var bkgPollingModel = this.options.backgroundPollingModel;
      var tableIsReadOnly = this.model.isSync();
      var canAddGeocoding = bkgPollingModel !== "" ? bkgPollingModel.canAddGeocoding() : true; // With new modals

      if (!this.options.geocoder.isGeocoding() && !tableIsReadOnly && canAddGeocoding) {
        var GeorefView = this.user.featureEnabled('new_modals') ? cdb.editor.GeoreferenceView : cdb.admin.GeocodingDialog;
        dlg = new GeorefView({
          table:  this.model,
          user:   this.user,
          tabs:   ['lonlat', 'city', 'admin', 'postal', 'ip', 'address'],
          option: 'lonlat'
        });
      } else if (this.options.geocoder.isGeocoding() || ( !canAddGeocoding && !tableIsReadOnly )) {
        if (newModals) {
          dlg = cdb.editor.ViewFactory.createDialogByTemplate('common/background_polling/views/geocodings/geocoding_in_progress');
        } else {
          dlg = new cdb.admin.GeocoderWorking();
        }
      } else {
        // If table can't geocode == is synched, return!
        return;
      }

      dlg.appendToBody().open({ center:true });
    }
  }

});
