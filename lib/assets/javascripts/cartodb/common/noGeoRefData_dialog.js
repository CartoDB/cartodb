cdb.admin.NoGeoRefDataDialog = cdb.admin.BaseDialog.extend({

  events: {
    "click .cancel": "addManually",
    "click .ok": "georeference"
  },

  initialize: function() {
    _.extend(this.options, {
      title: 'Georeference your table',
      content_classes: "grey",
      content: 'Your data seems to be not georeferenced. This means you will not see anything on the map unless you add it manually.',
      template_name: 'dashboard/views/noGeoRef_dialog',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Georeference",
      cancel_button_classes: "enabled",
      cancel_title: "Start adding features manually",
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
