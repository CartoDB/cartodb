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
      return;
    }

    data.options = typeof data.options === 'string' ? JSON.parse(data.options): data.options;
    data.options = data.options || {}
    var widget = t(data, vis);

    if (widget) {
      widget.type = type;
      return widget;
    }

    return false;
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
    //this.setMapPosition();
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


  _addLayers: function(layers, options) {
    for(var i = 0; i < layers.length; ++i) {
      var layerData = layers[i];
      this.loadLayer(layerData, options);
    }
  },

  addLegends: function(layers, mobile_enabled) {

    this.legends = new cdb.geo.ui.StackedLegend({
      legends: this.createLegendView(layers)
    });

    if (!mobile_enabled) {
      this.mapView.addOverlay(this.legends);
    }

  },

  _setLayerOptions: function(options) {

    var layers = [];

    // flatten layers (except baselayer)
    var layers = _.map(this.getLayers().slice(1), function(layer) {
      if (layer.getSubLayers) {
        return layer.getSubLayers();
      }
      return layer;
    });

    layers = _.flatten(layers);

    for (i = 0; i < Math.min(options.sublayer_options.length, layers.length); ++i) {

      var o = options.sublayer_options[i];
      var subLayer = layers[i];
      var legend = this.legends && this.legends.getLegendByIndex(i);

      if (legend) {
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
  },

  _addOverlays: function(overlays, options) {

    // Sort the overlays by its internal order
    overlays = _.sortBy(overlays, function(overlay){ return overlay.order == null ? 1000 : overlay.order; });

    this._createOverlays(overlays, options);

  },

  addTimeSlider: function(torqueLayer) {

    if (torqueLayer) {

      this.addOverlay({
        type: 'time_slider',
        layer: torqueLayer
      });

    }

  },

  _setupSublayers: function(layers, options) {

    options.sublayer_options = [];

    _.each(layers.slice(1), function(lyr) {

      if (lyr.type === 'layergroup') {
        _.each(lyr.options.layer_definition.layers, function(l) {
          options.sublayer_options.push({ visible: ( l.visible !== undefined ? l.visible : true ) })
        });
      } else if (lyr.type === 'namedmap') {
        _.each(lyr.options.named_map.layers, function(l) {
          options.sublayer_options.push({ visible: ( l.visible !== undefined ? l.visible : true ) })
        });
      } else if (lyr.type === 'torque') {
        options.sublayer_options.push({ visible: ( lyr.options.visible !== undefined ? lyr.options.visible : true ) })
      }

    });

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

    if (!this.checkModules(data.layers)) {

      if (this.moduleChecked) {

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

    options = options || {};

    this._applyOptions(data, options);

    // to know if the logo is enabled search in the overlays and see if logo overlay is included and is shown
    var has_logo_overlay = !!_.find(data.overlays, function(o) { return o.type === 'logo' && o.options.display; });

    this.cartodb_logo = (options.cartodb_logo !== undefined) ? options.cartodb_logo: has_logo_overlay;

    if (this.mobile) this.cartodb_logo = false;
    else if (!has_logo_overlay && options.cartodb_logo === undefined) this.cartodb_logo = true; // We set the logo by default

    var scrollwheel   = (options.scrollwheel === undefined)  ? data.scrollwheel : options.scrollwheel;

    // map
    data.maxZoom || (data.maxZoom = 20);
    data.minZoom || (data.minZoom = 0);

    //Force using GMaps ?
    if ( (this.gmaps_base_type) && (data.map_provider === "leaflet") ) {

      //Check if base_type is correct
      var typesAllowed = ['roadmap', 'gray_roadmap', 'dark_roadmap', 'hybrid', 'satellite', 'terrain'];
      if (_.contains(typesAllowed, this.gmaps_base_type)) {
        if (data.layers) {
          data.layers[0].options.type = 'GMapsBase';
          data.layers[0].options.base_type = this.gmaps_base_type;
          data.layers[0].options.name = this.gmaps_base_type;

          if (this.gmaps_style) {
            data.layers[0].options.style = typeof this.gmaps_style === 'string' ? JSON.parse(this.gmaps_style): this.gmaps_style;
          }

          data.map_provider = 'googlemaps';
          data.layers[0].options.attribution = ''; //GMaps has its own attribution
        } else {
          cdb.log.error('No base map loaded. Using Leaflet.');
        }
      } else {
        cdb.log.error('GMaps base_type "' + this.gmaps_base_type + ' is not supported. Using leaflet.');
      }
    }

    var mapConfig = {
      title: data.title,
      description: data.description,
      maxZoom: data.maxZoom,
      minZoom: data.minZoom,
      legends: data.legends,
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

    var map         = new cdb.geo.Map(mapConfig);
    this.map        = map;

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

    // Another div to prevent leaflet grabbing the div
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
    var mapView  = new cdb.geo.MapView.create(div_hack, map);

    this.mapView = mapView;

    this._addLayers(data.layers, options);

    if (options.legends || (options.legends === undefined && this.map.get("legends") !== false)) this.addLegends(data.layers, this.mobile_enabled);

    if (options.time_slider)       {

      var torque = _(this.getLayers()).filter(function(layer) { return layer.model.get('type') === 'torque'; })

      if (torque && torque.length) {

        this.torqueLayer = torque[0];

        if (!this.mobile_enabled && this.torqueLayer) {

          this.addTimeSlider(this.torqueLayer);

        }
      }
    }

    if (!options.sublayer_options) this._setupSublayers(data.layers, options);
    if (options.sublayer_options)  this._setLayerOptions(options);

    if (this.mobile_enabled){

      if (options.legends === undefined) {
        options.legends = this.legends ? true : false;
      }

      this.addMobile(data.overlays, data.layers, options);
    }

    this._addOverlays(data.overlays, options);

    _.defer(function() {
      self.trigger('done', self, self.getLayers());
    })

    return this;

  },

  _addFullScreen: function() {

    this.addOverlay({
      options: {
        allowWheelOnFullscreen: true
      },
      type: 'fullscreen'
    });

  },

  _createOverlays: function(overlays, options) {

    _.each(overlays, function(data) {

      var type = data.type;

      // We don't render certain overlays if we are in mobile
      if (this.mobile_enabled && type === "zoom")   return;
      if (this.mobile_enabled && type === 'header') return;

      // IE<10 doesn't support the Fullscreen API
      if (type === 'fullscreen' && $.browser.msie && parseFloat($.browser.version) <= 10) return;

      // Decide to create or not the custom overlays
      if (type === 'image' || type === 'text' || type === 'annotation') {

        var isDevice = data.options.device == "mobile" ? true : false;
        if (this.mobile !== isDevice) return;

        if (!options[type] && options[type] !== undefined) return;

      }

      // We add the overlay
      var overlay = this.addOverlay(data);

      // We show/hide the overlays
      if (overlay && (type in options) && options[type] === false) overlay.hide();

      var opt = data.options;

      if (type == 'share' && options["shareable"]  || type == 'share' && overlay.model.get("display") && options["shareable"] == undefined) overlay.show();
      if (type == 'layer_selector' && options[type] || type == 'layer_selector' && overlay.model.get("display") && options[type] == undefined) overlay.show();
      if (type == 'fullscreen' && options[type] || type == 'fullscreen' && overlay.model.get("display") && options[type] == undefined) overlay.show();

      if (!this.mobile_enabled && (type == 'search' && options[type] || type == 'search' && opt.display && options[type] == undefined)) overlay.show();

      if (!this.mobile_enabled && type === 'header') {

        var m = overlay.model;

        if (options.title !== undefined) {
          m.set("show_title", options.title);
        }

        if (options.description !== undefined) {
          m.set("show_description", options.description);
        }

        if (m.get('show_title') || m.get('show_description')) {
          $(".cartodb-map-wrapper").addClass("with_header");
        }

        overlay.render()
      }

    }, this);

  },

  addMobile: function(overlays, data_layers, options) {

    var layers;
    var layer = data_layers[1];

    if (layer.options && layer.options.layer_definition) {
      layers = layer.options.layer_definition.layers;
    } else if (layer.options && layer.options.named_map && layer.options.named_map.layers) {
      layers = layer.options.named_map.layers;
    }

    this.addOverlay({
      type: 'mobile',
      layers: layers,
      overlays: overlays,
      options: options,
      torqueLayer: this.torqueLayer
    });

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

  addOverlay: function(overlay) {

    overlay.map = this.map;

    var v = Overlay.create(overlay.type, this, overlay);

    if (v) {
      // Save tiles loader view for later
      if (overlay.type == "loader") {
        this.loader = v;
      }

      this.mapView.addOverlay(v);

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
        //this.setMapPosition();
      }
    }
    return v;
  },

  // change vizjson based on options
  _applyOptions: function(vizjson, opt) {
    opt = opt || {};
    opt = _.defaults(opt, {
      tiles_loader: true,
      loaderControl: true,
      infowindow: true,
      tooltip: true,
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
    this.tooltip    = opt.tooltip;

    if (opt.https) {
      this.https = true;
    }

    if (opt.gmaps_base_type) {
      this.gmaps_base_type = opt.gmaps_base_type;
    }

    if (opt.gmaps_style) {
      this.gmaps_style = opt.gmaps_style;
    }

    this.mobile         = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.mobile_enabled = (opt.mobile_layout && this.mobile) || opt.force_mobile;

    if (opt.force_mobile === false || opt.force_mobile === "false") this.mobile_enabled = false;

    if (!opt.title) {
      vizjson.title = null;
    }

    if (!opt.description) {
      vizjson.description = null;
    }

    if (!opt.tiles_loader) {
      remove_overlay('loader');
    }

    if (!opt.loaderControl) {
      remove_overlay('loader');
    }

    if (!this.mobile_enabled && opt.search) {
      if (!search_overlay('search')) {
        vizjson.overlays.push({
           type: "search",
           order: 3
        });
      }
    }

    if ( (opt.title && vizjson.title) || (opt.description && vizjson.description) ) {

      if (!search_overlay('header')) {
        vizjson.overlays.unshift({
          type: "header",
          order: 1,
          shareable: opt.shareable ? true: false,
          url: vizjson.url,
          options: {
            extra: {
              title: vizjson.title,
              description: vizjson.description,
              show_title: opt.title,
              show_description: opt.description
            }
          }
        });
      }
    }
 

    if (opt.layer_selector) {
      if (!search_overlay('layer_selector')) {
        vizjson.overlays.push({
          type: "layer_selector"
        });
      }
    }

    if (opt.shareable && !this.mobile_enabled) {
      if (!search_overlay('share')) {
        vizjson.overlays.push({
          type: "share",
          order: 2,
          url: vizjson.url
        });
      }
    }

    // We remove certain overlays in mobile devices
    if (this.mobile_enabled) {
      remove_overlay('logo');
      remove_overlay('share');
    }

    if (this.mobile) {
      remove_overlay('zoom');
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
  setMapPosition: function() { },

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

  getOverlaysByType: function(type) {
    return _(this.overlays).filter(function(v) {
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
    // try to change interactivity, it the layer is a named map 
    // it's inmutable so it'a assumed the interactivity already has
    // the fields it needs
    try {
      layer.setInteractivity(fields);
    } catch(e) {
    }
    layer.setInteraction(true);

    layer.bind(options.triggerEvent, function(e, latlng, pos, data, layer) {
      var render_fields = [];
      var d;
      for (var f = 0; f < fields.length; ++f) {
        var field = fields[f];
        if (d = data[field]) {
          render_fields.push({
            title: field,
            value: d,
            index: 0
          });
        }
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
