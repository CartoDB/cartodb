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
    if (!t) {
      cdb.log.error("Overlay: " + type + " does not exist");
    }
    var widget = t(data, vis);
    widget.type = type;
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
    if (!type) {
      cdb.log.error("creating a layer without type");
      return null;
    }
    var t = this._types[type.toLowerCase()];

    var c = {};
    c.type = type;
    _.extend(c, data, data.options);
    return new t(vis, c);
  },

  moduleForLayer: function(type) {
    if (type.toLowerCase() === 'torque') {
      return 'torque';
    }
    return null;
  },

  modulesForLayers: function(layers) {
    var modules = _(layers).map(function(layer) {
      return Layers.moduleForLayer(layer.type || layer.kind);
    });
    return _.compact(_.uniq(modules));
  }

};

cdb.vis.Layers = Layers;

var Loader = cdb.vis.Loader = {

  queue: [],
  current: undefined,
  _script: null,
  head: null,

  loadScript: function(src) {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = src;
      script.async = true;
      if (!Loader.head) {
        Loader.head = document.getElementsByTagName('head')[0];
      }
      // defer the loading because IE9 loads in the same frame the script
      // so Loader._script is null
      setTimeout(function() {
        Loader.head.appendChild(script);
      }, 0);
      return script;
  },

  get: function(url, callback) {
    if (!Loader._script) {
      Loader.current = callback;
      Loader._script = Loader.loadScript(url + (~url.indexOf('?') ? '&' : '?') + 'callback=vizjson');
    } else {
      Loader.queue.push([url, callback]);
    }
  },

  getPath: function(file) {
    var scripts = document.getElementsByTagName('script'),
        cartodbJsRe = /\/?cartodb[\-\._]?([\w\-\._]*)\.js\??/;
    for (i = 0, len = scripts.length; i < len; i++) {
      src = scripts[i].src;
      matches = src.match(cartodbJsRe);

      if (matches) {
        var bits = src.split('/');
        delete bits[bits.length - 1];
        return bits.join('/') + file;
      }
    }
    return null;
  },

  loadModule: function(modName) {
    var file = "cartodb.mod." + modName + (cartodb.DEBUG ? ".uncompressed.js" : ".js");
    var src = this.getPath(file);
    if (!src) {
      cartodb.log.error("can't find cartodb.js file");
    }
    Loader.loadScript(src);
  }
};

window.vizjson = function(data) {
  Loader.current && Loader.current(data);
  // remove script
  Loader.head.removeChild(Loader._script);
  Loader._script = null;
  // next element
  var a = Loader.queue.shift();
  if (a) {
    Loader.get(a[0], a[1]);
  }
};

cartodb.moduleLoad = function(name, mod) {
  cartodb[name] = mod;
  cartodb.config.modules.add({
    name: mod
  });
};

/**
 * visulization creation
 */
var Vis = cdb.core.View.extend({

  initialize: function() {
    _.bindAll(this, 'loadingTiles', 'loadTiles', '_onResize');

    this.https = false;
    this.overlays = [];
    this.moduleChecked = false;
    this.layersLoading = 0;

    if (this.options.mapView) {
      this.mapView = this.options.mapView;
      this.map = this.mapView.map;
    }

    // recalculate map position on orientation change
    if (!window.addEventListener) {
      window.attachEvent('orientationchange', this.doOnOrientationChange, this);
    } else {
      window.addEventListener('orientationchange', _.bind(this.doOnOrientationChange, this));
    }

  },

  doOnOrientationChange: function() {
    this.setMapPosition();
  },

  /**
   * check if all the modules needed to create layers are loaded
   */
  checkModules: function(layers) {
    var mods = Layers.modulesForLayers(layers);
    return _.every(_.map(mods, function(m) { return cartodb[m] !== undefined; }));
  },

  loadModules: function(layers, done) {
    var self = this;
    var mods = Layers.modulesForLayers(layers);
    for(var i = 0; i < mods.length; ++i) {
      Loader.loadModule(mods[i]);
    }
    function loaded () {
      if (self.checkModules(layers)) {
        cdb.config.unbind('moduleLoaded', loaded);
        done();
      }
    }
    
    cdb.config.bind('moduleLoaded', loaded);
    _.defer(loaded);
  },


  load: function(data, options) {
    var self = this;
    if (typeof(data) === 'string') {
      var url = data;
      cdb.vis.Loader.get(url, function(data) {
        if (data) {
          self.load(data, options);
        } else {
          self.throwError('error fetching viz.json file');
        }
      });
      return this;
    }

    if(!this.checkModules(data.layers)) {
      if(this.moduleChecked) {
        self.throwError("modules couldn't be loaded");
        return this;
      }
      this.moduleChecked = true;
      // load modules needed for layers
      this.loadModules(data.layers, function() {
        self.load(data, options);
      });
      return this;
    }


    // configure the vis in http or https
    if (window && window.location.protocol && window.location.protocol === 'https:') {
      this.https = true;
    }

    if (data.https) {
      this.https = data.https;
    }

    var scrollwheel = true;

    options = options || {};

    this._applyOptions(data, options);
    this.cartodb_logo = options.cartodb_logo;
    scrollwheel       = options.scrollwheel;

    // map
    data.maxZoom || (data.maxZoom = 20);
    data.minZoom || (data.minZoom = 0);

    var mapConfig = {
      title: data.title,
      description: data.description,
      maxZoom: data.maxZoom,
      minZoom: data.minZoom,
      scrollwheel: scrollwheel,
      provider: data.map_provider
    };

    // if the boundaries are defined, we add them to the map
    if (data.bounding_box_sw && data.bounding_box_ne) {
      mapConfig.bounding_box_sw = data.bounding_box_sw;
      mapConfig.bounding_box_ne = data.bounding_box_ne;
    }
    if (data.bounds) {
      mapConfig.view_bounds_sw = data.bounds[0];
      mapConfig.view_bounds_ne = data.bounds[1];
    } else {
      var center = data.center;
      if (typeof(center) === "string") {
        center = $.parseJSON(center);
      }
      mapConfig.center = center || [0, 0];
      mapConfig.zoom = data.zoom == undefined ? 4: data.zoom;
    }

    var map = new cdb.geo.Map(mapConfig);
    this.map = map;
    this.updated_at = data.updated_at || new Date().getTime();


    // If a CartoDB embed map is hidden by default, its
    // height is 0 and it will need to recalculate its size
    // and re-center again.
    // We will wait until it is resized and then apply
    // the center provided in the parameters and the
    // correct size.
    var map_h = this.$el.outerHeight();

    if (map_h === 0) {
      this.mapConfig = mapConfig;
      $(window).bind('resize', this._onResize);
    }

    var div = $('<div>').css({
      position: 'relative',
      width: '100%',
      height: '100%'
    });
    this.container = div;

    // Another div to prevent leaflet grabs the div
    var div_hack = $('<div>')
      .addClass("cartodb-map-wrapper")
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

    // Create the map
    var mapView = new cdb.geo.MapView.create(div_hack, map);
    this.mapView = mapView;


    // Add layers
    for(var i in data.layers) {
      var layerData = data.layers[i];
      this.loadLayer(layerData, options);
    }

    var legends, torqueLayer;
    var device = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (options.shareable && !device) {
      this.container.find(".cartodb-map-wrapper").append('<div class="cartodb-share" style="display: block;"><a href="#"></a></div>');
    }

    if (!device && options.legends) {
      this.addLegends(data.layers);
    } else {
      legends = this.createLegendView(data.layers);

      this.legends = new cdb.geo.ui.StackedLegend({
        legends: legends
      });
    }

    if(options.time_slider) {
      // add time slider
      var torque = _(this.getLayers()).filter(function(layer) { return layer.model.get('type') === 'torque'; })
      if (torque.length) {
        torqueLayer = torque[0];

        if (!device && torque.length) {
          this.addTimeSlider(torqueLayer);
        }

      }
    }

    if (device) this.addMobile(torqueLayer);

    // set layer options
    if (options.sublayer_options) {

      var layers = [];
      // flatten layers (except baselayer)
      var layers = _.map(this.getLayers().slice(1), function(layer) {
          if (layer.getSubLayers) {
            return layer.getSubLayers();
          }
          return layer;
      });
      layers = _.flatten(layers);

      for(i = 0; i < Math.min(options.sublayer_options.length, layers.length); ++i) {
        var o = options.sublayer_options[i];
        var subLayer = layers[i];
        var legend = this.legends && this.legends.getLegendByIndex(i);
        if(legend) {
          legend[o.visible ? 'show': 'hide']();
        }
        // HACK
        if(subLayer.model && subLayer.model.get('type') === 'torque') {
          if (o.visible === false) {
            subLayer.model.set('visible', false);
            var timeSlider = this.getOverlay('time_slider');
            if (timeSlider) {
              timeSlider.hide();
            }
          }
        } else {
          if (o.visible === false) subLayer.hide();
        }
      }
    }

    // Create the overlays
    for (var i in data.overlays) {
      this.addOverlay(data.overlays[i]);
    }

    var fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled;

    if (options.fullscreen && fullscreenEnabled && !device) this.addFullScreen();

    _.defer(function() {
      self.trigger('done', self, self.getLayers());
    })

    return this;
  },

  addFullScreen: function() {

    this.addOverlay({
      type: 'fullscreen'
    });

  },

  addMobile: function(torqueLayer) {

    this.addOverlay({
      type: 'mobile',
      torqueLayer: torqueLayer,
      legends: this.legends
    });

  },

  addTimeSlider: function(torqueLayer) {
    if (torqueLayer) {
      this.addOverlay({
        type: 'time_slider',
        layer: torqueLayer
      });
    }
  },

  addLegends: function(layers) {

    var legends = this.createLegendView(layers);

    this.legends = new cdb.geo.ui.StackedLegend({
       legends: legends
    });

    this.mapView.addOverlay(this.legends);

  },

   createLegendView: function(layers) {
    var legends = [];
    for(var i = layers.length - 1; i>= 0; --i) {
      var layer = layers[i];
      if(layer.legend) {
        layer.legend.data = layer.legend.items;
        var legend = layer.legend;

        if((legend.items && legend.items.length) || legend.template) {
          layer.legend.index = i;
          legends.push(new cdb.geo.ui.Legend(layer.legend));
        }
      }
      if(layer.options && layer.options.layer_definition) {
        legends = legends.concat(this.createLegendView(layer.options.layer_definition.layers));
      } else if(layer.options && layer.options.named_map && layer.options.named_map.layers) {
        legends = legends.concat(this.createLegendView(layer.options.named_map.layers));
      }
    }
    return legends;
  },

  addLegends: function(layers) {

    var legends = this.createLegendView(layers);
    this.legends = new cdb.geo.ui.StackedLegend({
       legends: legends
    });

    this.mapView.addOverlay(this.legends);
  },

  addOverlay: function(overlay) {
    overlay.map = this.map;
    var v = Overlay.create(overlay.type, this, overlay);

    if (v) {
      // Save tiles loader view for later
      if (overlay.type == "loader") {
        this.loader = v;
      }

      if (overlay.type == "header") {
        this.addView(v);
        this.container.append(v.el);
      } else {
        this.mapView.addOverlay(v);
      }
      this.overlays.push(v);

      v.bind('clean', function() {
        for(var i in this.overlays) {
          var o = this.overlays[i];
          if (v.cid === o.cid) {
            this.overlays.splice(i, 1)
            return;
          }
        }
      }, this);

      // Set map position correctly taking into account
      // header height
      if (overlay.type == "header") {
        this.setMapPosition();
      }
    }
    return v;
  },

  // change vizjson based on options
  _applyOptions: function(vizjson, opt) {
    opt = opt || {};
    opt = _.defaults(opt, {
      search: false,
      title: false,
      description: false,
      tiles_loader: true,
      zoomControl: true,
      loaderControl: true,
      layer_selector: false,
      searchControl: false,
      infowindow: true,
      tooltip: true,
      legends: true,
      time_slider: true
    });
    vizjson.overlays = vizjson.overlays || [];
    vizjson.layers = vizjson.layers || [];

    function search_overlay(name) {
      if (!vizjson.overlays) return null;
      for(var i = 0; i < vizjson.overlays.length; ++i) {
        if (vizjson.overlays[i].type === name) {
          return vizjson.overlays[i];
        }
      }
    }

    function remove_overlay(name) {
      if (!vizjson.overlays) return;
      for(var i = 0; i < vizjson.overlays.length; ++i) {
        if (vizjson.overlays[i].type === name) {
          vizjson.overlays.splice(i, 1);
          return;
        }
      }
    }

    this.infowindow = opt.infowindow;
    this.tooltip = opt.tooltip;

    if(opt.https) {
      this.https = true;
    }

    // remove search if the vizualization does not contain it
    if (opt.search || opt.searchControl) {
      vizjson.overlays.push({
         type: "search"
      });
    }

    if ( (opt.title && vizjson.title) || (opt.description && vizjson.description) ) {
      vizjson.overlays.unshift({
        type: "header",
        shareable: opt.shareable ? true: false,
        url: vizjson.url
      });

    }

    if (opt.shareable && !device) {
      vizjson.overlays.push({
        type: "share",
        url: vizjson.url
      });
    }

    var device = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (!device && opt.layer_selector) {
      vizjson.overlays.push({
        type: "layer_selector"
      });
    }

    if (!opt.title) {
      vizjson.title = null;
    }

    if (!opt.description) {
      vizjson.description = null;
    }

    if (!opt.tiles_loader) {
      remove_overlay('loader');
    }

    if (!opt.zoomControl) {
      remove_overlay('zoom');
    }

    if (!opt.loaderControl) {
      remove_overlay('loader');
    }

    // if bounds are present zoom and center will not taken into account
    var zoom = parseInt(opt.zoom);
    if (!isNaN(zoom)) {
      vizjson.zoom = zoom;
      vizjson.bounds = null;
    }

    // Center coordinates?
    var center_lat = parseFloat(opt.center_lat);
    var center_lon = parseFloat(opt.center_lon);
    if ( !isNaN(center_lat) && !isNaN(center_lon) ) {
      vizjson.center = [center_lat, center_lon];
      vizjson.bounds = null;
    }

    // Center object
    if (opt.center !== undefined) {
      vizjson.center = opt.center;
      vizjson.bounds = null;
    }

    // Bounds?
    var sw_lat = parseFloat(opt.sw_lat);
    var sw_lon = parseFloat(opt.sw_lon);
    var ne_lat = parseFloat(opt.ne_lat);
    var ne_lon = parseFloat(opt.ne_lon);

    if ( !isNaN(sw_lat) && !isNaN(sw_lon) && !isNaN(ne_lat) && !isNaN(ne_lon) ) {
      vizjson.bounds = [
        [ sw_lat, sw_lon ],
        [ ne_lat, ne_lon ]
      ];
    }

    if (vizjson.layers.length > 1) {
      var token = opt.auth_token;
      for(var i = 1; i < vizjson.layers.length; ++i) {
        var o = vizjson.layers[i].options;
        o.no_cdn = opt.no_cdn;
        o.force_cors = opt.force_cors;
        if(token) {
          o.auth_token = token;
        }
      }
    }

  },

  // Set map top position taking into account header height
  setMapPosition: function() {
    var map_h = this.$el.outerHeight();

    if (map_h !== 0) {
      var header_h = this.$(".cartodb-header:not(.cartodb-popup)").outerHeight();
      this.$el
        .find("div.cartodb-map-wrapper")
        .css("top", header_h);

      this.mapView.invalidateSize();
    }
  },

  createLayer: function(layerData, opts) {
    var layerModel = Layers.create(layerData.type || layerData.kind, this, layerData);
    return this.mapView.createLayer(layerModel);
  },

  _getSqlApi: function(attrs) {
    attrs = attrs || {};
    var port = attrs.sql_api_port
    var domain = attrs.sql_api_domain + (port ? ':' + port: '')
    var protocol = attrs.sql_api_protocol;
    var version = 'v1';
    if (domain.indexOf('cartodb.com') !== -1) {
      protocol = 'http';
      domain = "cartodb.com";
      version = 'v2';
    }

    var sql = new cartodb.SQL({
      user: attrs.user_name,
      protocol: protocol,
      host: domain,
      version: version
    });

    return sql;
  },

  addTooltip: function(layerView) {
    if(!layerView || !layerView.containTooltip || !layerView.containTooltip()) {
      return;
    }
    for(var i = 0; i < layerView.getLayerCount(); ++i) {
      var t = layerView.getTooltipData(i);
      if (t) {
        if (!layerView.tooltip) {
          var tooltip = new cdb.geo.ui.Tooltip({
            layer: layerView,
            template: t.template,
            position: 'bottom|right',
            vertical_offset: 10,
            horizontal_offset: 4,
            fields: t.fields,
            omit_columns: ['cartodb_id']
          });
          layerView.tooltip = tooltip;
          this.mapView.addOverlay(tooltip);
        }
        layerView.setInteraction(i, true);
      }
    }

    if (layerView.tooltip) {
      layerView.bind("featureOver", function(e, latlng, pos, data, layer) {
        var t = layerView.getTooltipData(layer);
        if (t) {
          layerView.tooltip.setTemplate(t.template);
          layerView.tooltip.setFields(t.fields);
          layerView.tooltip.setAlternativeNames(t.alternative_names);
          layerView.tooltip.enable();
        } else {
          layerView.tooltip.disable();
        }
      });
    }
  },

  addInfowindow: function(layerView) {

    if(!layerView.containInfowindow || !layerView.containInfowindow()) {
      return;
    }

    var mapView = this.mapView;
    var eventType = 'featureClick';
    var infowindow = null;

    // activate interactivity for layers with infowindows
    for(var i = 0; i < layerView.getLayerCount(); ++i) {
      //var interactivity = layerView.getSubLayer(i).get('interactivity');
      // if interactivity is not enabled we can't enable it
      if(layerView.getInfowindowData(i)) {// && interactivity && interactivity.indexOf('cartodb_id') !== -1) {
        if(!infowindow) {
          infowindow = Overlay.create('infowindow', this, layerView.getInfowindowData(i), true);
          mapView.addInfowindow(infowindow);
        }
        var index = layerView.getLayerNumberByIndex(i);
        layerView.setInteraction(index, true);
      }
    }

    if(!infowindow) {
      return;
    }

    infowindow.bind('close', function() {
      // when infowindow is closed remove all the filters
      // for tooltips
      for(var i = 0; i < layerView.getLayerCount(); ++i) {
        var t = layerView.tooltip;
        if (t) {
          t.setFilter(null);
        }
      }
    })

    // if the layer has no infowindow just pass the interaction
    // data to the infowindow
    layerView.bind(eventType, function(e, latlng, pos, data, layer) {

        var infowindowFields = layerView.getInfowindowData(layer);
        if (!infowindowFields) return;
        var fields = _.pluck(infowindowFields.fields, 'name');
        var cartodb_id = data.cartodb_id;

        layerView.fetchAttributes(layer, cartodb_id, fields, function(attributes) {

          // Old viz.json doesn't contain width and maxHeight properties
          // and we have to get the default values if there are not defined.
          var extra = _.defaults(
            {
              offset: infowindowFields.offset,
              width: infowindowFields.width,
              maxHeight: infowindowFields.maxHeight
            },
            cdb.geo.ui.InfowindowModel.prototype.defaults
          );

          infowindow.model.set({
            'fields': infowindowFields.fields,
            'template': infowindowFields.template,
            'template_type': infowindowFields.template_type,
            'alternative_names': infowindowFields.alternative_names,
            'offset': extra.offset,
            'width': extra.width,
            'maxHeight': extra.maxHeight
          });

          if (attributes) {
            infowindow.model.updateContent(attributes);
            infowindow.adjustPan();
          } else {
            infowindow.setError();
          }
        });

        // Show infowindow with loading state
        infowindow
          .setLatLng(latlng)
          .setLoading()
          .showInfowindow();

        if (layerView.tooltip) {
          layerView.tooltip.setFilter(function(feature) {
            return feature.cartodb_id !== cartodb_id;
          }).hide();
        }
    });

    var hovers = [];

    layerView.bind('mouseover', function() {
      mapView.setCursor('pointer');
    });

    layerView.bind('mouseout', function(m, layer) {
      mapView.setCursor('auto');
    });

    layerView.infowindow = infowindow.model;
  },

  loadLayer: function(layerData, opts) {
    var map = this.map;
    var mapView = this.mapView;
    //layerData.type = layerData.kind;
    var layer_cid = map.addLayer(Layers.create(layerData.type || layerData.kind, this, layerData), opts);

    var layerView = mapView.getLayerByCid(layer_cid);

    if (!layerView) {
      this.throwError("layer can't be created", map.layers.getByCid(layer_cid));
      return;
    }

    // add the associated overlays
    if(layerView && this.infowindow && layerView.containInfowindow && layerView.containInfowindow()) {
      this.addInfowindow(layerView);
    }

    if(layerView && this.tooltip && layerView.containTooltip && layerView.containTooltip()) {
      this.addTooltip(layerView);
    }

    if (layerView) {
      var self = this;

      var loadingTiles = function() {
        self.loadingTiles(opts);
      };

      var loadTiles = function() {
        self.loadTiles(opts);
      };

      layerView.bind('loading', loadingTiles);
      layerView.bind('load',    loadTiles);
    }

    return layerView;

  },

  loadingTiles: function() {
    if (this.loader) {
      this.$el.find(".cartodb-fullscreen").hide();
      this.loader.show()
    }
    if(this.layersLoading === 0) {
        this.trigger('loading');
    }
    this.layersLoading++;
  },

  loadTiles: function() {
    if (this.loader) {
      this.loader.hide();
      this.$el.find(".cartodb-fullscreen").fadeIn(150);
    }
    this.layersLoading--;
    // check less than 0 because loading event sometimes is
    // thrown before visualization creation
    if(this.layersLoading <= 0) {
      this.layersLoading = 0;
      this.trigger('load');
    }
  },

  throwError: function(msg, lyr) {
    cdb.log.error(msg);
    var self = this;
    _.defer(function() {
      self.trigger('error', msg, lyr);
    });
  },

  error: function(fn) {
    return this.bind('error', fn);
  },

  done: function(fn) {
    return this.bind('done', fn);
  },

  // public methods
  //

  // get the native map used behind the scenes
  getNativeMap: function() {
    return this.mapView.getNativeMap();
  },

  // returns an array of layers
  getLayers: function() {
    var self = this;
    return _.compact(this.map.layers.map(function(layer) {
      return self.mapView.getLayerByCid(layer.cid);
    }));
  },

  getOverlays: function() {
    return this.overlays;
  },

  getOverlay: function(type) {
    return _(this.overlays).find(function(v) {
      return v.type == type;
    });
  },

  _onResize: function() {
    $(window).unbind('resize', this._onResize);
    var self = this;
    self.mapView.invalidateSize();

    // This timeout is necessary due to GMaps needs time
    // to load tiles and recalculate its bounds :S
    setTimeout(function() {
      self.setMapPosition();
      var c = self.mapConfig;
      if (c.view_bounds_sw) {
        self.mapView.map.setBounds([
          c.view_bounds_sw,
          c.view_bounds_ne
        ]);
      } else {
        self.mapView.map.set({
          center: c.center,
          zoom: c.zoom
        });
      }
    }, 150);
  }

}, {

  /**
   * adds an infowindow to the map controlled by layer events.
   * it enables interaction and overrides the layer interacivity
   * ``fields`` array of column names
   * ``map`` native map object, leaflet of gmaps
   * ``layer`` cartodb layer (or sublayer)
   */
  addInfowindow: function(map, layer, fields, opts) {
    var options = _.defaults(opts || {}, {
      infowindowTemplate: cdb.vis.INFOWINDOW_TEMPLATE.light,
      templateType: 'mustache',
      triggerEvent: 'featureClick',
      templateName: 'light',
      extraFields: [],
      cursorInteraction: true
    });

    if(!map) throw new Error('map is not valid');
    if(!layer) throw new Error('layer is not valid');
    if(!fields && fields.length === undefined ) throw new Error('fields should be a list of strings');

    var f = [];
    fields = fields.concat(options.extraFields);
    for(var i = 0; i < fields.length; ++i) {
      f.push({ name: fields, order: i});
    }

    var infowindowModel = new cdb.geo.ui.InfowindowModel({
      fields: f,
      template_name: options.templateName
    });

    var infowindow = new cdb.geo.ui.Infowindow({
       model: infowindowModel,
       mapView: map.viz.mapView,
       template: new cdb.core.Template({
         template: options.infowindowTemplate,
         type: options.templateType
       }).asFunction()
    });

    map.viz.mapView.addInfowindow(infowindow);
    layer.setInteractivity(fields);
    layer.setInteraction(true);

    layer.bind(options.triggerEvent, function(e, latlng, pos, data, layer) {
      var render_fields = [];
      for(var k in data) {
        render_fields.push({
          title: k,
          value: data[k],
          index: 0
        });
      }
      infowindow.model.set({
        content:  {
          fields: render_fields,
          data: data
        }
      });

      infowindow
        .setLatLng(latlng)
        .showInfowindow();
      infowindow.adjustPan();
    }, infowindow);

    // remove the callback on clean
    infowindow.bind('clean', function() {
      layer.unbind(options.triggerEvent, null, infowindow);
    });

    if(options.cursorInteraction) {
      cdb.vis.Vis.addCursorInteraction(map, layer);
    }

    return infowindow;

  },

  addCursorInteraction: function(map, layer) {
    var mapView = map.viz.mapView;
    layer.bind('mouseover', function() {
      mapView.setCursor('pointer');
    });

    layer.bind('mouseout', function(m, layer) {
      mapView.setCursor('auto');
    });
  },

  removeCursorInteraction: function(map, layer) {
    var mapView = map.viz.mapView;
    layer.unbind(null, null, mapView);
  }

});

cdb.vis.INFOWINDOW_TEMPLATE = {
  light: [
    '<div class="cartodb-popup">',
    '<a href="#close" class="cartodb-popup-close-button close">x</a>',
    '<div class="cartodb-popup-content-wrapper">',
      '<div class="cartodb-popup-content">',
        '{{#content.fields}}',
          '{{#title}}<h4>{{title}}</h4>{{/title}}',
          '{{#value}}',
            '<p {{#type}}class="{{ type }}"{{/type}}>{{{ value }}}</p>',
          '{{/value}}',
          '{{^value}}',
            '<p class="empty">null</p>',
          '{{/value}}',
        '{{/content.fields}}',
      '</div>',
    '</div>',
    '<div class="cartodb-popup-tip-container"></div>',
  '</div>'
  ].join('')
};

cdb.vis.Vis = Vis;

})();
