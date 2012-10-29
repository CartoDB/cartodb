/**
 * map tab shown in cartodb admin
 */

cdb.open.PublicMapTab = cdb.admin.MapTab.extend({

  className: 'map',

  initialize: function() {
    window.mapdebug = this;
    this.template = this.getTemplate('table_public/views/maptab_public');
    this.map = this.model;
    this.map_enabled = false;
    this.featureHovered = null;
    this.infowindowModel = this.options.infowindow;

    //this.add_related_model(this.options.dataLayer);
    this.add_related_model(this.map);
    this.add_related_model(this.options.table);
    this.add_related_model(this.infowindowModel);
  },



 /**
   * map can't be loaded from the beggining, it needs the DOM to be loaded
   * so we wait until is actually shown to create the mapview and show it
   */
  enableMap: function() {
    var self = this;
    if(!this.map_enabled) {
      var div = this.$('#map');

      var mapViewClass = cdb.geo.LeafletMapView;

      if(this.map.get('provider') === 'googlemaps') {
        mapViewClass = cdb.geo.GoogleMapsMapView;
      }
      this.mapView = new mapViewClass({
        el: div,
        map: this.map
      });


      // Set map center
      this.setMapCenter();

      this.map_enabled = true;
      this.mapView.bind('newLayerView', self._bindDataLayer, self);


      // bind data layer if it is already added to the map
      var dataLayer = this.map.get('dataLayer');
      if(dataLayer) {
        var dl = this.mapView.getLayerByCid(self.map.get('dataLayer').cid);
        this._bindDataLayer(dl);
      }

      // Zoom control
      var zoomControl = new cdb.geo.ui.Zoom({
        model:    this.map,
        template: cdb.templates.getTemplate("table/views/zoom_control")
      });
      this.$el.append(zoomControl.render().$el);
      this.zoom = zoomControl;

      // Tiles loader
      var tilesLoader = this.loader = new cdb.admin.TilesLoader({
        template: cdb.templates.getTemplate("table/views/tiles_loader")
      });
      this.$el.append(tilesLoader.render().$el);

      // infowindow
      self.infowindow = new cdb.open.PublicMapInfowindow({
        model: self.infowindowModel,
        template: cdb.templates.getTemplate('table/views/infowindow'),
        mapView: self.mapView,
        table: self.options.table
      });
      self.mapView.$el.append(self.infowindow.el);

    }
  },

  clearMap: function() {
    this.mapView.clean();
    this.zoom.clean();
    this.infowindow.clean();

    delete this.mapView;
    delete this.zoom;
    delete this.infowindow;

    this.map_enabled = false;
  },

  /**
   *  Set map center thanks to the bounds of the data
   */
  setMapCenter: function() {
    var values = this.map.toJSON().values;
    var sw = values && values.view_bounds_sw && ($.parseJSON(values.view_bounds_sw));
    var ne = values && values.view_bounds_ne && ($.parseJSON(values.view_bounds_ne));

    // If there is a bounds defined, just show it
    if (sw && ne)
      this.mapView.showBounds([sw,ne]);
  },

  render: function() {
    this.$el.html('');
    this.$el.append(this.template());
    return this;
  },


});

