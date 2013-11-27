
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
    title:      _t('No georeferenced data on your table'),
    content:    _t('Although we can see you have data on your table, it does not \
                appear to be georeferenced. You will not see anything on the map if \
                your records are not georeferenced. Click on Goereference if you want \
                to use a geocoder to get location out of your data, or cancel.'),
    no_content: _t('There seems to be no data on this table, so there is nothing \
                to represent on the map. You can add some data or run SQL queries \
                to select some. Click cancel to continue.'),
    close:      _t('Ok, close'),
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
    this.$('a.ok').text(this.hasContent ? this._TEXTS.georef : this._TEXTS.close );
    
    if (!this.hasContent) {
      this.$('a.cancel').hide();
    }
    
    return this.hasContent ? this._TEXTS.content : this._TEXTS.no_content;
  },

  ok: function() {
    if (this.hasContent) {
      var dlg;
      if (!this.options.geocoder.isGeocoding() && !this.model.isSync()) {
        dlg = new cdb.admin.GeoreferenceDialog({
          table: this.model,
          user: this.user,
          geocoder: this.options.geocoder
        });
      } else if (this.options.geocoder.isGeocoding()) {
        dlg = new cdb.admin.GeocoderWorking();
      } else {
        // If table can't geocode == is synched, return!
        return;
      }

      dlg.appendToBody().open({ center:true });
    }
  }

});