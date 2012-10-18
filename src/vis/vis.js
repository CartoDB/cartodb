(function() {

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

    var c = {};
    _.extend(c, data, data.options);
    return new t(vis, c);
  }

};

cdb.vis.Layers = Layers;

/**
 * visulization creation
 */
var Vis = cdb.core.View.extend({

  initialize: function() {
    if(this.options.mapView) {
      this.mapView = this.options.mapView;
      this.map = this.mapView.map;
    }
  },

  load: function(data) {
    // map
    data.maxZoom || (data.maxZoom = 20);
    data.minZoom || (data.minZoom = 0);

    var mapConfig = {
      title: data.title,
      description: data.description,
      maxZoom: data.maxZoom,
      minZoom: data.minZoom,
      provider: data.provider
    };

    // if the boundaries are defined, we add them to the map
    if(data.bounding_box_sw && data.bounding_box_ne) {
      mapConfig.bounding_box_sw = data.bounding_box_sw;
      mapConfig.bounding_box_ne = data.bounding_box_ne;
    }

    var map = new cdb.geo.Map(mapConfig);

    var div = $('<div>').css({
      width: '100%',
      height: '100%'
    });
    this.$el.append(div);
    var mapView = new cdb.geo.MapView.create(div, map);
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
      this.loadLayer(layerData);
    }

    if(data.bounds) {
      mapView.showBounds(data.bounds);
    } else {
      var center = data.center;
      if (typeof(center) === "string") {
        center = JSON.parse(center);
      }

      map.setCenter(center || [0, 0]);
      map.setZoom(data.zoom || 4);
    }
  },

  createLayer: function(layerData, opts) {
    var layerModel = Layers.create(layerData.type || layerData.kind, this, layerData);
    return this.mapView.createLayer(layerModel);
  },

  addInfowindow: function(layerView) {
    var model = layerView.model;
    var eventType = layerView.model.get('eventType') || 'featureClick';
    var infowindow = Overlay.create('infowindow', this, model.get('infowindow'), true);
    this.mapView.addInfowindow(infowindow);

    var infowindowFields = layerView.model.get('infowindow');

    // if the layer has no infowindow just pass the interaction
    // data to the infowindow
    layerView.bind(eventType, function(e, latlng, pos, interact_data) {
        var content = interact_data;
        if(infowindowFields) {
          var render_fields = [];
          var fields = infowindowFields.fields;
          for(var j = 0; j < fields.length; ++j) {
            var f = fields[j];
            render_fields.push({
              title: f.title ? f.name: null,
              value: interact_data[f.name],
              index: j ? j:null // mustache does not recognize 0 as false :( 
            });
          }
          content = render_fields;
        }
        infowindow.model.set({ content:  { fields: content} });
        infowindow.setLatLng(latlng).showInfowindow();
    });
  },

  loadLayer: function(layerData, opts) {
    var map = this.map;
    var mapView = this.mapView;
    layerData.type = layerData.kind;
    var layer_cid = map.addLayer(Layers.create(layerData.type || layerData.kind, this, layerData), opts);

    var layerView = mapView.getLayerByCid(layer_cid);
    // add the associated overlays
    if(layerData.infowindow) {
      this.addInfowindow(layerView);
      dataLayer.bind('featureOver', function(e, latlon, pxPos, data) {
        $(document.body).css('cursor', 'pointer');
      });
      dataLayer.bind('featureOut', function() {
        $(document.body).css('cursor', 'auto');
      });
    }

    return layerView;

  }

});

cdb.vis.Vis = Vis;

})();
