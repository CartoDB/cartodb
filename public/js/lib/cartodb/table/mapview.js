
/**
 * small photo of available base map layers
 */
cdb.admin.BaseMapView = cdb.core.View.extend({

  events: {
    'click': 'activate'
  },

  tagName: 'li',

  initialize: function() {
    this.map = this.options.map;
  },

  render: function() {
    this.$el.html('layer' + this.cid);
    return this;
  },

  activate: function(e) {
    e.preventDefault();
    var layer = this.map.getBaseLayer();
    layer.set(this.model.toJSON());
    cdb.log.debug("enabling layer: " + layer.get('urlTemplate'));
    return false;
  }

});

cdb.admin.BaseMapChooser = cdb.core.View.extend({

  tagName: 'ul',

  initialize: function() {
    _.bindAll(this, 'add');
    this.baseLayers = this.options.baseLayers;
    this.baseLayers.bind('reset', this.render, this);
    this.baseLayers.bind('add', this.add, this);
  },

  _addAll: function() {
    this.baseLayers.each(this.add);
  },

  add: function(lyr) {
    var v = new cdb.admin.BaseMapView({ model: lyr, map: this.model });
    cdb.log.debug("added base layer option: " + lyr.get('urlTemplate'));
    this.addView(v);
    this.$el.append(v.render().el);
  },

  render: function() {
    this.$el.html('');
    this._addAll();
    return this;
  }

});

cdb.admin.MapTab = cdb.core.View.extend({

  className: 'map',

  initialize: function() {
    this.map = this.model;
    this.map_enabled = false;
    this.infowindowModel = new cdb.geo.ui.InfowindowModel({ 
      content: "GHOAJSOL"
    });

    this.add_related_model(this.options.dataLayer);
    this.add_related_model(this.map);
    this.add_related_model(this.options.table);
    this.add_related_model(this.infowindowModel);
  },

  enableMap: function() {
    var self = this;
    if(!this.map_enabled) {
        var div = $('<div>');
        div.css({'height': '900px'});
        this.baseLayerChooser = new cdb.admin.BaseMapChooser({
          model: this.map,
          baseLayers: this.options.baseLayers
        });
        this.$el.append(this.baseLayerChooser.render().el);
        this.$el.append(div);
        this.mapView = new cdb.geo.LeafletMapView({
          el: div,
          map: this.map
        });
        this.map_enabled = true;

        this.map.layers.bind('add', function(lyr) {
          if(lyr.cid == self.options.dataLayer.cid) {
            self.layerDataView = self.mapView.getLayerByCid(self.options.dataLayer.cid);

            self.layerDataView.bind('featureClick', self.featureClick, self);
            self.infowindow = new cdb.admin.MapInfowindow({
              model: self.infowindowModel,
              template: cdb.templates.getTemplate('table/views/infowindow'),
              mapView: self.mapView,
              table: self.options.table
            });
            self.mapView.$el.append(self.infowindow.el);
          }
        });

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
    this.$el.css({'height': '900px'});
    return this;
  }

});

