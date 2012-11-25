cdb.admin.NoGeoRefDataDialog = cdb.admin.BaseDialog.extend({
  _TEXTS: {
    _CONTENT: 'Although we can see you have data on your table, it does not appear to be georeferenced. You will not see anything on the map if your records are not georeferenced. Click on Goereference if you want to use a geocoder to get location out of your data, or cancel.',
    _NO_CONTENT: "There seems to be no data on this table, so there is nothing to represent on the map. You can add some data or run SQL queries to select some. Click cancel to continue."
  },

  events: {
    "click .cancel": "addManually",
    "click .ok": "georeference"
  },

  initialize: function(options) {

    _.extend(this.options, {
      title: 'Georeference your table',
      content_classes: "grey",
      template_name: 'dashboard/views/noGeoRef_dialog',
      clean_on_hide: true,
      ok_title: "Georeference",
      hasContent: false,
      cancel_button_classes: "enabled",
      cancel_title: "Cancel",
      modal_type: "noGeoRef",
      width: 525,
      error_messages: {}
    });
    this.elder('initialize');
    _.bindAll(this, "georeference", "addManually");
  },

  /**
   * Render the content for the create dialog
   */
  render_content: function() {
    this.options.hasContent = (this.model._data.length  > 0);
    this.options.ok_button_classes = this.options.hasContent? "button grey" : "button grey disabled"
    this.options.content = this.options.hasContent? this._TEXTS._CONTENT : this._TEXTS._NO_CONTENT;
    var template = this.getTemplate(this.options.template_name)(this.options);
    return template;
  },

  georeference: function(ev) {
    ev.preventDefault();
    if(this.hasContent) {
      this.trigger('georeference');
      this.hide();
    }
  },

  addManually: function(ev) {
    ev.preventDefault();
    this.trigger('manual');
    this.hide();
  }
})
