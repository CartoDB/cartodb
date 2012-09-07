/**
 * defines the container for an overlay.
 * It places the overlay
 */
var Overlay = {

  _types: {},

  // register a type to be created
  register: function(type, creatorFn) {
    Overlay._types[type] = creatorFn;
  },

  // create a type given the data
  // raise an exception if the type does not exist
  create: function(type, vis, data) {
    var t = Overlay._types[type];
    if(!t) {
      cdb.log.error("Overlay: " + type + " does not exist");
    }
    var widget = t(data, vis);
    return widget;
  }
};

cdb.vis.Overlay = Overlay;

// layer factory
var Layers = {

  _types: {},

  register: function(type, creatorFn) {
    this._types[type] = creatorFn;
  },

  create: function(type, vis, data) {
    if(!type) {
      cdb.log.error("creating a layer without type");
      return null;
    }
    var t = this._types[type.toLowerCase()];
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
    data.maxZoom || (data.maxZoom = 20);
    data.minZoom || (data.minZoom = 0);
    data.bounding_box_sw || (data.bounding_box_sw = [0,0]);
    data.bounding_box_ne || (data.bounding_box_ne= [0,0]);
    var map = new cdb.geo.Map({
      title: data.title,
      description: data.description,
      maxZoom: data.maxZoom,
      minZoom: data.minZoom,
      bounding_box_sw: data.bounding_box_sw,
      bounding_box_ne: data.bounding_box_ne
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
      if(layerData.type.toLowerCase() == 'cartodb' && layerData.infowindow) {
          var infowindow = Overlay.create('infowindow', this, layerData.infowindow, true);
          mapView.addInfowindow(infowindow);
          var dataLayer = mapView.getLayerByCid(layer_cid);
          dataLayer.cid = layer_cid;
          dataLayer.bind('featureClick', function(e, latlng, pos, interact_data) {
            // prepare data
            var layer = map.layers.getByCid(this.cid);
            // infoWindow only shows if the layer is active
            if(layer.get('active')) {
              var render_fields= [];
              var fields = layer.get('infowindow').fields;
              for(var j = 0; j < fields.length; ++j) {
                var f = fields[j];
                render_fields.push({
                  title: f.title ? f.name: null,
                  value: interact_data[f.name]
                });
              }
              infowindow.model.set({ content:  { fields: render_fields } });
              infowindow.setLatLng(latlng).showInfowindow();
            }
          });
      }
    }

    if(data.bounds) {
      mapView.showBounds(data.bounds);
    } else {
      map.setCenter(data.center || [0, 0]);
      map.setZoom(data.zoom || 4);
    }
  },

});

cdb.vis.Vis = Vis;
