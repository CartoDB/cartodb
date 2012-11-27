(function() {

var _requestCache = {};

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
    c.type = type;
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
    _.bindAll(this, 'loadingTiles', 'loadTiles');

    this.https = false;

    if(this.options.mapView) {
      this.mapView = this.options.mapView;
      this.map = this.mapView.map;
    }
  },


  load: function(data, options) {
    if(typeof(data) === 'string') {
      var self = this;
      var url = data;
      reqwest({
          url: url + (~url.indexOf('?') ? '&' : '?') + 'callback=vizjson',
          type: 'jsonp',
          jsonpCallback: 'callback',
          success: function(data) {
            if(data) {
              self.load(data, options);
            } else {
              self.trigger('error', 'error fetching viz.json file');
            }
          }
      });
      return this;
    }

    // configure the vis in http or https
    if(window && window.location.protocol && window.location.protocol === 'https:') {
      this.https = true;
    }

    if(data.https) {
      this.https = data.https;
    }

    if(options) {
      this._applyOptions(data, options);
    }

    // map
    data.maxZoom || (data.maxZoom = 20);
    data.minZoom || (data.minZoom = 0);

    var mapConfig = {
      title: data.title,
      description: data.description,
      maxZoom: data.maxZoom,
      minZoom: data.minZoom,
      provider: data.map_provider
    };

    // if the boundaries are defined, we add them to the map
    if(data.bounding_box_sw && data.bounding_box_ne) {
      mapConfig.bounding_box_sw = data.bounding_box_sw;
      mapConfig.bounding_box_ne = data.bounding_box_ne;
    }
    if(data.bounds) {
      mapConfig.view_bounds_sw = data.bounds[0];
      mapConfig.view_bounds_ne = data.bounds[1];
    } else {
      var center = data.center;
      if (typeof(center) === "string") {
        center = $.parseJSON(center);
      }
      mapConfig.center = center || [0, 0];
      mapConfig.zoom = data.zoom || 4;
    }

    var map = new cdb.geo.Map(mapConfig);
    this.map = map;

    var div = $('<div>').css({
      width: '100%',
      height: '100%'
    });

    // Another div to prevent leaflet grabs the div
    var div_hack = $('<div>')
      .addClass("map-wrapper")
      .css({
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%'
      });

    div.append(div_hack);
    this.$el.append(div);

    // Create the overlays
    for (var i in data.overlays) {
      var overlay = data.overlays[i];
      overlay.map = map;
      var v = Overlay.create(overlay.type, this, overlay);

      if (v) {
        // Save tiles loader view for later
        if (overlay.type == "loader") {
          this.loader = v;
        }

        this.addView(v);
        div.append(v.el);

        // Set map position correctly taking into account
        // header height
        if (overlay.type == "header") {
          this.setMapPosition();
        }
      }
    }

    // Create the map
    var mapView = new cdb.geo.MapView.create(div_hack, map);
    this.mapView = mapView;

    // Add layers
    for(var i in data.layers) {
      var layerData = data.layers[i];
      this.loadLayer(layerData);
    }

    return this;
  },


  // change vizjson based on options
  _applyOptions: function(vizjson, opt) {
    opt = opt || {};
    opt = _.defaults(opt, {
      search: true,
      title: true,
      description: true,
      tiles_loader: true
    });

    function search_overlay(name) {
      if(!vizjson.overlays) return null;
      for(var i = 0; i < vizjson.overlays.length; ++i) {
        if(vizjson.overlays[i].type === name) {
          return vizjson.overlays[i];
        }
      }
    }

    function remove_overlay(name) {
      if(!vizjson.overlays) return;
      for(var i = 0; i < vizjson.overlays.length; ++i) {
        if(vizjson.overlays[i].type === name) {
          vizjson.overlays.splice(i, 1);
          return;
        }
      }
    }

    if(opt.https) {
      this.https = true;
    }

    // remove search if the vizualization does not contain it
    if (opt.search != undefined && !opt.search) {
      remove_overlay('search');
    }

    if(!opt.title  && !opt.description  && !opt.shareable) {
      remove_overlay('header');
    }

    if(!opt.title) {
      vizjson.title = null;
    }

    if(!opt.description) {
      vizjson.description = null;
    }

    if(!opt.tiles_loader) {
      remove_overlay('loader');
    }

    if(!opt.shareable) {
      var s = search_overlay('header');
      if(s) {
        s.shareable = false;
      }
    }

    // if bounds are present zoom and center will not taken into account
    if(opt.zoom !== undefined) {
      vizjson.zoom = parseFloat(opt.zoom);
    }

    if(opt.center_lat !== undefined) {
      vizjson.center = [parseFloat(opt.center_lat), parseFloat(opt.center_lon)];
    }

    if(opt.sw_lat !== undefined) {
      vizjson.bounds = [
        [parseFloat(opt.sw_lat), parseFloat(opt.sw_lon)],
        [parseFloat(opt.ne_lat), parseFloat(opt.ne_lon)],
      ];
    }


    if(opt.sql) {
      vizjson.layers[1].options.query = opt.sql;
    }
    if(opt.style) {
      vizjson.layers[1].options.tile_style = opt.style;
    }

    vizjson.layers[1].options.no_cdn = opt.no_cdn;

  },

  // Set map top position taking into account header height
  setMapPosition: function() {
    var header_h = this.$el.parent().find(".header").outerHeight();
  
    this.$el
      .find("div.map-wrapper")
      .css("top", header_h);
  },

  createLayer: function(layerData, opts) {
    var layerModel = Layers.create(layerData.type || layerData.kind, this, layerData);
    return this.mapView.createLayer(layerModel);
  },

  addInfowindow: function(layerView) {
    var model = layerView.model;
    var eventType = layerView.model.get('eventType') || 'featureClick';
    var infowindow = Overlay.create('infowindow', this, model.get('infowindow'), true);
    var mapView = this.mapView;
    mapView.addInfowindow(infowindow);

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
        infowindow.model.set({ content:  { fields: content, data: interact_data} });
        infowindow.setLatLng(latlng).showInfowindow();
    });

    layerView.bind('featureOver', function(e, latlon, pxPos, data) {
      mapView.setCursor('pointer');
    });
    layerView.bind('featureOut', function() {
      mapView.setCursor('auto');
    });

    layerView.infowindow = infowindow.model;
  },

  loadLayer: function(layerData, opts) {
    var map = this.map;
    var mapView = this.mapView;
    layerData.type = layerData.kind;
    var layer_cid = map.addLayer(Layers.create(layerData.type || layerData.kind, this, layerData), opts);

    var layerView = mapView.getLayerByCid(layer_cid);
    
    // add the associated overlays
    if(layerData.infowindow &&
      layerData.infowindow.fields &&
      layerData.infowindow.fields.length > 0) {
      this.addInfowindow(layerView);
    }

    if (layerView) {
      layerView.bind('loading', this.loadingTiles);
      layerView.bind('load',    this.loadTiles);
    }

    return layerView;

  },

  loadingTiles: function() {
    if(this.loader) {
      this.loader.show()
    }
  },

  loadTiles: function() {
    if(this.loader) {
      this.loader.hide();
    }
  },

  error: function(fn) {
    this.bind('error', fn);
  }

});

cdb.vis.Vis = Vis;

})();
