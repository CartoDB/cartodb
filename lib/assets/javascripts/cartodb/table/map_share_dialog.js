/**
 * shows a dialog to share a map view
 * new ExportTableDialog({
 *  table: table_model
 * })
 * 
 */
cdb.admin.ShareMapDialog = cdb.admin.BaseDialog.extend({

  events: cdb.core.View.extendEvents({
  }),

  initialize: function() {
    _.extend(this.options, {
      title: _t("Share your map"),
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "close",
      modal_type: "",
      width: 600,
      modal_class: 'map_share_dialog',
      include_footer: false
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {
    this.$('.content').append(
      this.getTemplate('table/views/share_map_dialog')({
        title: this.options.table.get('name'),
        description: this.options.table.get('description')
      })
    );
    var self = this;
    //wait to open
    setTimeout(function() {
      self.mapView = new cdb.geo.LeafletMapView({
          el: self.$('.map'),
          map: self.options.map
      });
      self.addView(self.mapView);
    }, 1000);
    var zoomControl = new cdb.geo.ui.Zoom({
      model:    this.options.map,
      template: this.getTemplate("table/views/zoom_control")
    });
    self.addView(zoomControl);
    this.$('.map_wrapper').append(zoomControl.render().$el);
    return '';
  }

});
