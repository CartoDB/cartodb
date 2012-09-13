/**
 * map tab shown in cartodb admin
 */

cdb.admin.MapTab = cdb.core.View.extend({

  events: {
    'click .share a': 'shareMap'
  },

  className: 'map',

  initialize: function() {
    this.map = this.model;
    this.map_enabled = false;
    this.infowindowModel = this.options.infowindow;

    //this.add_related_model(this.options.dataLayer);
    this.add_related_model(this.map);
    this.add_related_model(this.options.table);
    this.add_related_model(this.infowindowModel);

    var self = this;

    cdb.god.bind("hidePanel", function(ev) {
      self._moveShareButton("hide");
    });
    cdb.god.bind("showPanel", function(ev) {
      self._moveShareButton("show");
    });

    this.map.bind('change:provider', this.switchMapType, this);
  },

  clearMap: function() {
    this.mapView.clean();
    this.zoom.clean();
    this.infowindow.clean();
    this.baseLayerChooser.clean();

    delete this.mapView;
    delete this.zoom;
    delete this.infowindow;
    delete this.baseLayerChooser;

    this.map_enabled = false;
  },

  /**
   * this function is used when the map library is changed. Each map library
   * works in different way and need to recreate all the components again
   */
  switchMapType: function() {
    if(this.map_enabled) {
      this.clearMap();
      this.render();
      this.enableMap();
    }
  },


  /**
   * map can't be loaded from the beggining, it needs the DOM to be loaded
   * so we wait until is actually shown to create the mapview and show it
   */
  enableMap: function() {
    var self = this;
    if(!this.map_enabled) {
      var div = this.$('#map')
        , base_maps = this.$('.base_maps');

      this.baseLayerChooser = new cdb.admin.BaseMapChooser({
        model: this.map,
        baseLayers: this.options.baseLayers
      });

      base_maps.append(this.baseLayerChooser.render().el);

      var mapViewClass = cdb.geo.LeafletMapView;
      if(this.map.get('provider') === 'googlemaps') {
        mapViewClass = cdb.geo.GoogleMapsMapView;
      }

      this.mapView = new mapViewClass({
        el: div,
        map: this.map
      });

      this.map_enabled = true;

      this.mapView.bind('newLayerView', self._bindDataLayer, self);

      // bind data layer if it is already added to the map 
      var dataLayer = this.map.get('dataLayer');
      if(dataLayer) {
        var dl = this.mapView.getLayerByCid(self.map.get('dataLayer').cid);
        this._bindDataLayer(dl);
      }

      var zoomControl = new cdb.geo.ui.Zoom({
        model:    this.map,
        template: cdb.templates.getTemplate("table/views/zoom_control")
      });
      this.$el.append(zoomControl.render().$el);
      this.zoom = zoomControl;

      self.infowindow = new cdb.admin.MapInfowindow({
        model: self.infowindowModel,
        //template: cdb.templates.getTemplate('table/views/infowindow'),
        mapView: self.mapView,
        table: self.options.table
      });
      self.mapView.$el.append(self.infowindow.el);

    }
  },

  /**
   * when the layer view is created this method is called
   * to attach all the click events
   */
  _bindDataLayer: function(layer) {
    var self = this;
    if(layer.model.get('type') === 'CartoDB') {
      // unbind previos stuff
      if(self.layerDataView) {
        self.layerDataView.unbind(null, null, this);
      }

      self.layerDataView = self.mapView.getLayerByCid(self.map.get('dataLayer').cid);
      if(self.layerDataView) {
        self.layerDataView.bind('featureClick', self.featureClick, self);
      }
    }
  },

  featureClick: function(e, latlon, pxPos, data) {
    if(data.cartodb_id) {
      this.infowindow
        .setLatLng(latlon)
        .setFeatureInfo(data.cartodb_id)
        .showInfowindow();
    } else {
      cdb.log.error("can't show infowindow, no cartodb_id on data");
    }
  },

  _moveShareButton: function(type) {
    this.$el.find("div.share")
      .animate({
        right: type == "show" ? 592 : 57
      }, 400);
  },

  render: function() {
    this.$el.html('');
    this.$el.append(this.getTemplate('table/views/maptab')());
    return this;
  },

  shareMap: function(e) {
    e.preventDefault();
    var dlg = new cdb.admin.ShareMapDialog({
      map: this.model,
      table: this.options.table
    });
    dlg.appendToBody().open();
    return false;
  }

});

