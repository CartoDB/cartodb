cdb.admin.NoGeoRefDataDialog = cdb.admin.BaseDialog.extend({
  _TEXTS: {
    _CONTENT: _t('Although we can see you have data on your table, it does not appear to be georeferenced. You will not see anything on the map if your records are not georeferenced. Click on Goereference if you want to use a geocoder to get location out of your data, or cancel.'),
    _NO_CONTENT: _t('There seems to be no data on this table, so there is nothing to represent on the map. You can add some data or run SQL queries to select some. Click cancel to continue.')
  },

  events: {
    "click .cancel": "addManually",
    "click .ok": "georeference"
  },

  initialize: function(options) {
    _.bindAll(this, "georeference", "addManually");

    _.extend(this.options, {
      title: 'No georeferenced data on your table',
      content_classes: "grey",
      content: '',
      template_name: 'table/views/noGeoRef_dialog',
      clean_on_hide: true,
      ok_title: "Georeference",
      hasContent: false,
      ok_button_classes: "button grey",
      cancel_button_classes: "enabled",
      cancel_title: "Cancel",
      modal_type: "noGeoRef",
      width: 525,
      error_messages: {}
    });
    this.elder('initialize');
  },

  /**
   * Render the content for the create dialog
   */
  render_content: function() {
    this.hasContent = (this.model._data.length  > 0);

    this.$('a.ok')
      [ !this.hasContent ? 'addClass' : 'removeClass' ]('disabled')
      [ !this.hasContent ? 'attr'     : 'removeAttr' ]('disabled')

    return this.hasContent ? this._TEXTS._CONTENT : this._TEXTS._NO_CONTENT;
  },

  georeference: function(ev) {
    ev.preventDefault();
    if(this.hasContent) {
      var dlg = new cdb.admin.GeoreferenceDialog({
        model: this.model,
        geocoder: this.options.geocoder
      });
      dlg.appendToBody().open({ center:true });
      this.hide();
    }
  },

  addManually: function(ev) {
    this.hide();
  }
})
