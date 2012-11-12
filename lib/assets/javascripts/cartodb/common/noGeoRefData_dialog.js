cdb.admin.NoGeoRefDataDialog = cdb.admin.BaseDialog.extend({

  events: {
    "click .cancel": "addManually",
    "click .ok": "georeference"
  },

  initialize: function() {
    _.extend(this.options, {
      title: 'Georeference your table',
      content_classes: "grey",
      content: 'Although we can see you have data on your table, it does not appear to be georeferenced. You will not see anything on the map if your records are not georeferenced. Click on Goereference if you want to use a geocoder to get location out of your data, or cancel.',
      template_name: 'dashboard/views/noGeoRef_dialog',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Georeference",
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
  },

  georeference: function(ev) {
    ev.preventDefault();
    this.trigger('georeference');
    this.hide();
  },

  addManually: function(ev) {
    ev.preventDefault();
    this.trigger('manual');
    this.hide();
  }
})
