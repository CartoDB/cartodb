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

    if (this.options.mapView) {
      this.mapView = this.options.mapView;
      this.map = this.mapView.map;
    }
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
    //TODO: add a timeout to raise error
    cdb.config.bind('moduleLoaded', loaded);
    loaded();
  },

  load: function(data, options) {
    var self = this;
    if (typeof(data) === 'string') {
      var url = data;
      cdb.vis.Loader.get(url, function(data) {
        if (data) {
          self.load(data, options);
        } else {
          self.trigger('error', 'error fetching viz.json file');
        }
      });
      return this;
    }

    if(!this.checkModules(data.layers)) {
      if(this.moduleChecked) {
        cdb.log.error("modules not found");
        self.trigger('error', "modules couldn't be loaded");
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
      this.loadLayer(layerData);
    }

    if(options.legends) {
      this.addLegends(data.layers);
    }

    if(options.time_slider) {
      // add time slider
      var torque = _(this.getLayers()).filter(function(layer) { return layer.model.get('type') === 'torque'; })
      if (torque.length) {
        this.addTimeSlider(torque[0]);
      }
    }

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
        var legend = this.legends && this.legends.getLayerByIndex(i);
        if(legend) {
          legend[o.visible ? 'show': 'hide']();
        }
        /*if (this.legends) {
          var j = options.sublayer_options.length - i - 1;
          var legend = this.legends && this.legends.options.legends[j];
          if (legend) {
            o.visible ? legend.show(): legend.hide();
          }
        }*/
        if (o.visible === false) subLayer.hide();
      }
    }

    // Create the overlays
    for (var i in data.overlays) {
      this.addOverlay(data.overlays[i]);
    }

    _.defer(function() {
      self.trigger('done', self, self.getLayers());
    })

    return this;
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
    function createLegendView(layers) {
      var legends = [];
      for(var i = layers.length - 1; i>= 0; --i) {
        var layer = layers[i];
        if(layer.legend) {
          layer.legend.data = layer.legend.items;
          var legend = layer.legend;
          if(legend.items && legend.items.length) {
            layer.legend.index = i;
            legends.push(new cdb.geo.ui.Legend(layer.legend));
          }
        }
        if(layer.options && layer.options.layer_definition) {
          legends = legends.concat(createLegendView(layer.options.layer_definition.layers));
        }
      }
      return legends;
    }

    legends = createLegendView(layers);
    var stackedLegend = new cdb.geo.ui.StackedLegend({
       legends: legends
    });
    this.legends = stackedLegend;

    this.mapView.addOverlay(stackedLegend);
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

    if(opt.https) {
      this.https = true;
    }

    // remove search if the vizualization does not contain it
    if (opt.search || opt.searchControl) {
      vizjson.overlays.push({
         type: "search"
      });
    }

    if (opt.title  || opt.description || opt.shareable) {
      vizjson.overlays.unshift({
        type: "header",
        shareable: opt.shareable ? true: false,
        url: vizjson.url
      });
    }

    if (opt.layer_selector) {
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
    if (opt.zoom !== undefined) {
      vizjson.zoom = parseFloat(opt.zoom);
      vizjson.bounds = null;
    }

    if (opt.center_lat !== undefined) {
      vizjson.center = [parseFloat(opt.center_lat), parseFloat(opt.center_lon)];
      vizjson.bounds = null;
    }

    if (opt.center !== undefined) {
      vizjson.center = opt.center;
      vizjson.bounds = null;
    }

    if (opt.sw_lat !== undefined) {
      vizjson.bounds = [
        [parseFloat(opt.sw_lat), parseFloat(opt.sw_lon)],
        [parseFloat(opt.ne_lat), parseFloat(opt.ne_lon)],
      ];
    }

    if (vizjson.layers.length > 1) {
      for(var i = 1; i < vizjson.layers.length; ++i) {
        vizjson.layers[i].options.no_cdn = opt.no_cdn;
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

  addInfowindow: function(layerView) {

    if(!layerView.containInfowindow || !layerView.containInfowindow()) {
      return;
    }

    var mapView = this.mapView;
    var eventType = 'featureClick';
    var infowindow = null;

    // activate interactivity for layers with infowindows
    for(var i = 0; i < layerView.getLayerCount(); ++i) {
      var interactivity = layerView.getSubLayer(i).get('interactivity');
      // if interactivity is not enabled we can't enable it
      if(layerView.getInfowindowData(i) && interactivity && interactivity.indexOf('cartodb_id') !== -1) {
        if(!infowindow) {
          infowindow = Overlay.create('infowindow', this, layerView.getInfowindowData(i), true);
          mapView.addInfowindow(infowindow);
        }
        layerView.setInteraction(i, true);
      }
    }

    if(!infowindow) {
      return;
    }

    var sql = this._getSqlApi(layerView.options)


    // if the layer has no infowindow just pass the interaction
    // data to the infowindow
    layerView.bind(eventType, function(e, latlng, pos, data, layer) {
        var cartodb_id = data.cartodb_id
        var infowindowFields = layerView.getInfowindowData(layer)
        var fields = infowindowFields.fields;

        infowindow.model.set({
          'template': infowindowFields.template,
          'template_type': infowindowFields.template_type
        });

        // Scaping column names with double quotes
        var column_names = _.map(_.pluck(fields, 'name'), function(n) { return "\"" + n + "\"" }).join(',');

        // Send request
        sql.execute('select {{{ fields }}} from ({{{ sql }}}) as _cartodbjs_alias where cartodb_id = {{{ cartodb_id }}}', {
          fields: column_names,
          cartodb_id: cartodb_id,
          sql: layerView.getQuery(layer)
        })
        .done(function(interact_data) {
          if (interact_data.rows.length == 0 ) return;
          interact_data = interact_data.rows[0];
          if (infowindowFields) {
            var render_fields = [];
            var fields = infowindowFields.fields;
            for(var j = 0; j < fields.length; ++j) {
              var f = fields[j];
              var value = String(interact_data[f.name]);
              if(interact_data[f.name] != undefined && value != "") {
                render_fields.push({
                  title: f.title ? f.name : null,
                  value: interact_data[f.name],
                  index: j ? j : null
                });
              }
            }

            // manage when there is no data to render
            if (render_fields.length === 0) {
              render_fields.push({
                title: null,
                value: 'No data available',
                index: j ? j : null,
                type: 'empty'
              });
            }
            content = render_fields;
          }


          infowindow.model.set({
            content:  {
              fields: content,
              data: interact_data
            }
          })
          infowindow.adjustPan();
        })
        .error(function() {
          infowindow.setError();
        })


        // Show infowindow with loading state
        infowindow
          .setLatLng(latlng)
          .setLoading()
          .showInfowindow();
    });

    var hovers = [];

    layerView.bind('featureOver', function(e, latlon, pxPos, data, layer) {
      hovers[layer] = 1;
      if(_.any(hovers))
        mapView.setCursor('pointer');
    });

    layerView.bind('featureOut', function(m, layer) {
      hovers[layer] = 0;
      if(!_.any(hovers))
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
      this.trigger('error', "layer can't be created", map.layers.getByCid(layer_cid));
      return;
    }

    // add the associated overlays
    if(layerView && this.infowindow && layerView.containInfowindow && layerView.containInfowindow()) {
      this.addInfowindow(layerView);
    }

    if (layerView) {
      layerView.bind('loading', this.loadingTiles);
      layerView.bind('load',    this.loadTiles);
    }

    return layerView;

  },

  loadingTiles: function() {
    if (this.loader) {
      this.loader.show()
    }
  },

  loadTiles: function() {
    if (this.loader) {
      this.loader.hide();
    }
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

    var hovers = [];
    var mapView = map.viz.mapView;

    layer.bind('featureOver', function(e, latlon, pxPos, data, layer) {
      hovers[layer] = 1;
      if(_.any(hovers))
        mapView.setCursor('pointer');
    }, mapView);

    layer.bind('featureOut', function(m, layer) {
      hovers[layer] = 0;
      if(!_.any(hovers))
        mapView.setCursor('auto');
    }, mapView);
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
