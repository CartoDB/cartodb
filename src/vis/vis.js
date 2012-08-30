/**
 * defines the container for an overlay.
 * It places the overlay
 */
var Overlay = cdb.vis.Overlay = cdb.core.View.extend({

  initialize: function() {
    this.widget = this.options.widget;
    this.addView(this.widget);
    var pos = this._calculatePosition();
    this.$el.css({
      position: 'absolute',
      top: pos.top,
      left: pos.left
    });
    this.$el.append(this.widget.el);
  },

  _calculatePosition: function() {
    var pos = this.options.data.pos || [0, 0];
    return {
      top: pos[1],
      left: pos[0]
    };
  }

}, {

  _types: {},

  // register a type to be created
  register: function(type, creatorFn) {
    Overlay._types[type] = creatorFn;
  },

  // create a type given the data
  // raise an exception if the type does not exist
  create: function(type, vis, data, nowrap) {
    var t = Overlay._types[type];
    if(!t) {
      cdb.log.error("Overlay: " + type + " does not exist");
    }
    var widget = t(data, vis);
    if(nowrap) {
      return new Overlay({
        widget: widget,
        data: data
      });
    }
    return widget;
  }
});

// layer factory
var Layers = {

  _types: {},

  register: function(type, creatorFn) {
    this._types[type] = creatorFn;
  },

  create: function(type, vis, data) {
    var t = this._types[type];
    return new t(vis, data);
  }

};

cdb.vis.Layers = Layers;

/**
 * visulization creation
 */
var Vis = cdb.core.View.extend({

  initialize: function() {
  },

  load: function(data) {

    // map
    var map = new cdb.geo.Map({
      title: data.title,
      description: data.description
    });
    var div = $('<div>').css({
      width: '100%',
      height: '100%'
    });
    this.$el.append(div);
    var mapView = new cdb.geo.LeafletMapView({
      el: div,
      map: map
    });
    this.map = map;
    this.mapView = mapView;
    

    // overlays
    for(var i in data.overlays) {
      var overlay = data.overlays[i];
      overlay.map = map;
      var v = Overlay.create(overlay.type, this, overlay);
      this.addView(v);
      this.mapView.$el.append(v.el);
    }

    // layers
    for(var i in data.layers) {
      var layerData = data.layers[i];
      var layer_cid = map.addLayer(Layers.create(layerData.type, this, layerData));

      // add the associated overlays
      if(layerData.type == 'cartodb' && layerData.infowindow) {
          var infowindow = Overlay.create('infowindow', this, layerData.infowindow, false);
          mapView.addInfowindow(infowindow);
          var dataLayer = mapView.getLayerByCid(layer_cid);
          dataLayer.bind('featureClick', function(e, latlng) {
            infowindow.setLatLng(latlng).showInfowindow();
          });
      }
    }

    map.setCenter(data.center || [0, 0]);
    map.setZoom(data.zoom || 4);
  },

});

cdb.Vis = Vis;
