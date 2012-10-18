/**
 * map tab shown in cartodb admin
 */

cdb.open.PublicMapTab = cdb.admin.MapTab.extend({

  className: 'map',

  initialize: function() {
    window.mapdebug = this;
    this.template = this.getTemplate('table/views/maptab');
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
    console.log('enable')
    var self = this;
    if(!this.map_enabled) {
      var div = this.$('#map');

      var mapViewClass = cdb.geo.LeafletMapView;
      if(this.map.get('provider') === 'googlemaps') {
        mapViewClass = cdb.geo.GoogleMapsMapView;
      }
console.log(2);
      this.mapView = new mapViewClass({
        el: div,
        map: this.map
      });


      this.map_enabled = true;
      console.log(3);
      this.mapView.bind('newLayerView', self._bindDataLayer, self);


      // bind data layer if it is already added to the map
      var dataLayer = this.map.get('dataLayer');
      if(dataLayer) {
        var dl = this.mapView.getLayerByCid(self.map.get('dataLayer').cid);
        this._bindDataLayer(dl);
      }
console.log(4);
      var zoomControl = new cdb.geo.ui.Zoom({
        model:    this.map,
        template: cdb.templates.getTemplate("table/views/zoom_control")
      });
      this.$el.append(zoomControl.render().$el);
      this.zoom = zoomControl;

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

  render: function() {
    this.$el.html('');
    console.log('render');
    this.$el.append(this.template());
    return this;
  },


});

