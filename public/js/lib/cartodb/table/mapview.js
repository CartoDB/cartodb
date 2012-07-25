/**
 * map tab shown in cartodb admin
 */

cdb.admin.MapTab = cdb.core.View.extend({

  className: 'map',

  initialize: function() {
    this.map = this.model;
    this.map_enabled = false;
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
        var div = $('<div>').attr("id","map")
          , base_maps = $('<div>').attr("class","base_maps");

        this.baseLayerChooser = new cdb.admin.BaseMapChooser({
          model: this.map,
          baseLayers: this.options.baseLayers
        });
        
        base_maps.append(this.baseLayerChooser.render().el);

        this.$el.append(div);
        this.$el.append(base_maps);
        this.mapView = new cdb.geo.LeafletMapView({
          el: div,
          map: this.map
        });
        this.map_enabled = true;

        this.map.bind('change:dataLayer', function(lyr) {
          self._bindDataLayer();
        });

        self.infowindow = new cdb.admin.MapInfowindow({
          model: self.infowindowModel,
          template: cdb.templates.getTemplate('table/views/infowindow'),
          mapView: self.mapView,
          table: self.options.table
        });
        self.mapView.$el.append(self.infowindow.el);

    }
  },

  _bindDataLayer: function() {
    var self = this;

    // unbind previos stuff
    if(self.layerDataView) {
      self.layerDataView.unbind(null, null, this);
    }

    self.layerDataView = self.mapView.getLayerByCid(self.map.get('dataLayer').cid);
    if(self.layerDataView) {
      self.layerDataView.bind('featureClick', self.featureClick, self);
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

  render: function() {
    // this.$el.css({'height': '900px'});
    return this;
  }

});

