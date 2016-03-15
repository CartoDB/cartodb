var _ = require('underscore');
var Backbone = require('backbone');
var $ = require('jquery');
var log = require('cdb.log');
var util = require('cdb.core.util');
var Loader = require('../core/loader');
var View = require('../core/view');
var StackedLegend = require('../geo/ui/legend/stacked-legend');
var Map = require('../geo/map');
var MapViewFactory = require('../geo/map-view-factory');
var LegendModel = require('../geo/ui/legend-model');
var Legend = require('../geo/ui/legend');
var SQL = require('../api/sql');
var InfowindowModel = require('../geo/ui/infowindow-model');
var Infowindow = require('../geo/ui/infowindow');
var Template = require('../core/template');
var Layers = require('./vis/layers');
var Overlay = require('./vis/overlay');
var INFOWINDOW_TEMPLATE = require('./vis/infowindow-template');
var DataviewsFactory = require('../dataviews/dataviews-factory');
var DataviewCollection = require('../dataviews/dataviews-collection');
var InfowindowManager = require('./infowindow-manager');
var TooltipManager = require('./tooltip-manager');
var WindshaftConfig = require('../windshaft/config');
var WindshaftClient = require('../windshaft/client');
var WindshaftLayerGroupConfig = require('../windshaft/layergroup-config');
var WindshaftNamedMapConfig = require('../windshaft/namedmap-config');
var WindshaftMap = require('../windshaft/windshaft-map');
var AnalysisFactory = require('../analysis/analysis-factory');

/**
 * Visualization creation
 */
var Vis = View.extend({
  DEFAULT_MAX_ZOOM: 20,
  DEFAULT_MIN_ZOOM: 0,

  initialize: function () {
    _.bindAll(this, 'loadingTiles', 'loadTiles', '_onResize');

    this.overlays = [];

    if (this.options.mapView) {
      this.mapView = this.options.mapView;
      this.map = this.mapView.map;
    }
  },

  _addLegends: function (legends) {
    if (this.legends) {
      this.legends.remove();
    }

    this.legends = new StackedLegend({
      legends: legends
    });

    this.mapView.addOverlay(this.legends);
  },

  addLegends: function (layers) {
    this._addLegends(this.createLegendView(layers));
  },

  _setLayerOptions: function (options) {
    var layers = [];

    // flatten layers (except baselayer)
    var layers = _.map(this.getLayers().slice(1), function (layer) {
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
        legend[o.visible ? 'show' : 'hide']();
      }

      // HACK
      if (subLayer.model && subLayer.model.get('type') === 'torque') {
        if (o.visible === false) {
          subLayer.model.set('visible', false);
        }
      }
    }
  },

  _addOverlays: function (overlays, data, options) {
    overlays = overlays.toJSON();
    // Sort the overlays by its internal order
    overlays = _.sortBy(overlays, function (overlay) {
      return overlay.order === null ? Number.MAX_VALUE : overlay.order;
    });

    // clean current overlays
    while (this.overlays.length !== 0) {
      this.overlays.pop().clean();
    }

    this._createOverlays(overlays, data, options);
  },

  _createOverlays: function (overlays, vis_data, options) {
    _(overlays).each(function (data) {
      var type = data.type;

      // IE<10 doesn't support the Fullscreen API
      if (type === 'fullscreen' && util.browser.ie && util.browser.ie.version <= 10) return;

      // Decide to create or not the custom overlays
      if (type === 'image' || type === 'text' || type === 'annotation') {
        var isDevice = data.options.device == 'mobile' ? true : false;
        if (this.mobile !== isDevice) return;
        if (!options[type] && options[type] !== undefined) {
          return;
        }
      }

      // We add the header overlay
      if (type === 'header') {
        var overlay = this._addHeader(data, vis_data);
      } else {
        var overlay = this.addOverlay(data);
      }

      // We show/hide the overlays
      if (overlay && (type in options) && options[type] === false) overlay.hide();

      var opt = data.options;

      if (type == 'layer_selector' && options[type] || type == 'layer_selector' && overlay.model.get('display') && options[type] == undefined) {
        overlay.show();
      }

      if (type == 'fullscreen' && options[type] || type == 'fullscreen' && opt.display && options[type] == undefined) {
        overlay.show();
      }

      if (type == 'search' && options[type] || type == 'search' && opt.display && options[type] == undefined) {
        overlay.show();
      }

      if (type === 'header') {
        var m = overlay.model;

        if (options.title !== undefined) {
          m.set('show_title', options.title);
        }

        if (options.description !== undefined) {
          m.set('show_description', options.description);
        }

        if (m.get('show_title') || m.get('show_description')) {
          $('.cartodb-map-wrapper').addClass('with_header');
        }

        overlay.render();
      }
    }, this);
  },

  _setupSublayers: function (layers, options) {
    options.sublayer_options = [];

    _.each(layers.slice(1), function (lyr) {
      if (lyr.type === 'layergroup') {
        _.each(lyr.options.layer_definition.layers, function (l) {
          options.sublayer_options.push({ visible: ( l.visible !== undefined ? l.visible : true) });
        });
      } else if (lyr.type === 'namedmap') {
        _.each(lyr.options.named_map.layers, function (l) {
          options.sublayer_options.push({ visible: ( l.visible !== undefined ? l.visible : true) });
        });
      } else if (lyr.type === 'torque') {
        options.sublayer_options.push({ visible: ( lyr.options.visible !== undefined ? lyr.options.visible : true) });
      }
    });
  },

  load: function (data, options) {
    if (typeof (data) === 'string') {
      var url = data;
      Loader.get(url, function (data) {
        if (data) {
          this.load(data, options);
        } else {
          this.throwError('error fetching viz.json file');
        }
      }.bind(this));

      return;
    }

    this.https = (window && window.location.protocol && window.location.protocol === 'https:') || !!data.https;

    options = options || {};

    this._applyOptionsToVizJSON(data, options);

    this._dataviewsCollection = new DataviewCollection();

    // Create the WindhaftClient

    var endpoint;
    var configGenerator;
    var datasource = data.datasource;

    // TODO: We can use something else to differentiate types of "datasource"s
    if (datasource.template_name) {
      endpoint = [WindshaftConfig.MAPS_API_BASE_URL, 'named', datasource.template_name].join('/');
      configGenerator = WindshaftNamedMapConfig;
    } else {
      endpoint = WindshaftConfig.MAPS_API_BASE_URL;
      configGenerator = WindshaftLayerGroupConfig;
    }

    var windshaftClient = new WindshaftClient({
      endpoint: endpoint,
      urlTemplate: datasource.maps_api_template,
      userName: datasource.user_name,
      forceCors: datasource.force_cors || true
    });

    // Create the WindshaftMap

    var apiKey = options.apiKey;
    this._windshaftMap = new WindshaftMap(null, { // eslint-disable-line
      client: windshaftClient,
      configGenerator: configGenerator,
      apiKey: apiKey,
      statTag: datasource.stat_tag
    });

    // Create the Map

    var scrollwheel = (options.scrollwheel === undefined) ? data.scrollwheel : options.scrollwheel;

    // Do not allow pan map if zoom overlay and scrollwheel are disabled unless
    // mobile view is enabled
    // Check if zoom overlay is present.
    var hasZoomOverlay = _.isObject(_.find(data.overlays, function (overlay) {
      return overlay.type == 'zoom';
    }));

    var allowDragging = this.isMobileDevice() || hasZoomOverlay || scrollwheel;

    this.mapConfig = {
      title: data.title,
      description: data.description,
      maxZoom: data.maxZoom || this.DEFAULT_MAX_ZOOM,
      minZoom: data.minZoom || this.DEFAULT_MIN_ZOOM,
      legends: data.legends,
      scrollwheel: scrollwheel,
      drag: allowDragging,
      provider: data.map_provider,
      vector: data.vector,
    };

    if (data.bounds) {
      this.mapConfig.view_bounds_sw = data.bounds[0];
      this.mapConfig.view_bounds_ne = data.bounds[1];
    } else {
      var center = data.center;

      if (typeof (center) === 'string') {
        center = $.parseJSON(center);
      }

      this.mapConfig.center = center || [0, 0];
      this.mapConfig.zoom = data.zoom === undefined ? 4 : data.zoom;
    }

    this.map = new Map(this.mapConfig, {
      windshaftMap: this._windshaftMap,
      dataviewsCollection: this._dataviewsCollection
    });

    // If a CartoDB embed map is hidden by default, its
    // height is 0 and it will need to recalculate its size
    // and re-center again.
    // We will wait until it is resized and then apply
    // the center provided in the parameters and the
    // correct size.
    var map_h = this.$el.outerHeight();

    if (map_h === 0) {
      $(window).bind('resize', this._onResize);
    }

    // Create the MapView

    var div = $('<div>').css({
      position: 'relative',
      width: '100%',
      height: '100%'
    });

    this.container = div;

    // Another div to prevent leaflet grabbing the div
    var div_hack = $('<div>')
      .addClass('cartodb-map-wrapper')
      .css({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%'
      });

    div.append(div_hack);

    this.$el.append(div);

    var mapViewFactory = new MapViewFactory();
    this.mapView = mapViewFactory.createMapView(this.map.get('provider'), this.map, div_hack);

    // Bindings

    if (options.legends || (options.legends === undefined && this.map.get('legends') !== false)) {
      this.map.layers.bind('reset', this.addLegends, this);
    }

    this.mapView.bind('newLayerView', this._addLoading, this);

    // Create the Layer Models and set them on hte map
    var layerModels = this._newLayerModels(data, this.map);

    var infowindowManager = new InfowindowManager(this);
    infowindowManager.manage(this.mapView, this.map);

    var tooltipManager = new TooltipManager(this);
    tooltipManager.manage(this.mapView, this.map);

    // Create the collection of Overlays
    var overlaysCollection = new Backbone.Collection();
    overlaysCollection.bind('reset', function (overlays) {
      this._addOverlays(overlays, data, options);
    }, this);
    overlaysCollection.reset(data.overlays);

    // Create the public Dataview Factory
    this.dataviews = new DataviewsFactory(null, {
      dataviewsCollection: this._dataviewsCollection,
      layersCollection: this.map.layers,
      map: this.map,
      windshaftMap: this._windshaftMap
    });

    this._analysisCollection = new Backbone.Collection();

    // Public Analysis Factory
    this.analysis = new AnalysisFactory({
      analysisCollection: this._analysisCollection
    });

    if (!options.skipMapInstantiation) {
      this.instantiateMap();
    }

    // Lastly: reset the layer models on the map
    this.map.layers.reset(layerModels);

    // Global variable for easier console debugging / testing
    window.vis = this;

    return this;
  },

  /**
   * Force a map instantiation.
   * Only expected to be called if {skipMapInstantiation} flag is set to true when vis is created.
   */
  instantiateMap: function () {
    var self = this;
    this._dataviewsCollection.on('add reset remove', _.debounce(this._invalidateSizeOnDataviewsChanges, 10), this);
    this.map.instantiateMap();

    // Trigger 'done' event
    _.defer(function () {
      self.trigger('done', self, self.map.layers);
    });
  },

  /**
   * Sets the API Key that is required to make authenticated requests to Windshaft (a.k.a the Tiler)
   */
  setAPIKey: function (apiKey) {
    this._windshaftMap.setAPIKey(apiKey);
  },

  centerMapToOrigin: function () {
    this.mapView.invalidateSize();
    var c = this.mapConfig;
    if (c.view_bounds_sw && c.view_bounds_ne) {
      this.map.setBounds([
        c.view_bounds_sw,
        c.view_bounds_ne
      ]);
    } else {
      this.map.setCenter(c.center);
    }
  },

  _newLayerModels: function (vizjson, map) {
    var layerModels = [];
    var layersOptions = {
      https: this.https,
      map: map
    };
    _.each(vizjson.layers, function (layerData) {
      if (layerData.type === 'layergroup' || layerData.type === 'namedmap') {
        var layersData;
        if (layerData.type === 'layergroup') {
          layersData = layerData.options.layer_definition.layers;
        } else {
          layersData = layerData.options.named_map.layers;
        }
        _.each(layersData, function (layerData) {
          layerModels.push(Layers.create('CartoDB', layerData, layersOptions));
        });
      } else {
        layerModels.push(Layers.create(layerData.type, layerData, layersOptions));
      }
    });

    return layerModels;
  },

  _invalidateSizeOnDataviewsChanges: function () {
    if (this._dataviewsCollection.size() > 0) {
      this.mapView.invalidateSize();
    }
  },

  _addHeader: function (data, vis_data) {
    return this.addOverlay({
      type: 'header',
      options: data.options
    });
  },

  _createLegendView: function (layer, layerView) {
    if (layer.legend) {
      layer.legend.data = layer.legend.items;
      var legend = layer.legend;

      if ((legend.items && legend.items.length) || legend.template) {
        var legendAttrs = _.extend(layer.legend, {
          visible: layer.visible
        });
        var legendModel = new LegendModel(legendAttrs);
        var legendView = new Legend({ model: legendModel });
        layerView.bind('change:visibility', function (layer, hidden) {
          legendView[hidden ? 'hide' : 'show']();
        });
        layerView.legend = legendModel;
        return legendView;
      }
    }
    return null;
  },

  createLegendView: function (layers) {
    var legends = [];
    var self = this;
    for (var i = layers.length - 1; i >= 0; --i) {
      var cid = layers.at(i).cid;
      var layer = layers.at(i).attributes;
      if (layer.visible) {
        var layerView = this.mapView.getLayerViewByLayerCid(cid);
        if (layerView) {
          var layerView = this.mapView.getLayerViewByLayerCid(cid);
          legends.push(this._createLayerLegendView(layer, layerView));
        }
      }
    }
    return _.flatten(legends);
  },

  _createLayerLegendView: function (layer, layerView) {
    var self = this;
    var legends = [];
    if (layer.options && layer.options.layer_definition) {
      var sublayers = layer.options.layer_definition.layers;
      _(sublayers).each(function (sub, i) {
        legends.push(self._createLegendView(sub, layerView.getSubLayer(i)));
      });
    } else if (layer.options && layer.options.named_map && layer.options.named_map.layers) {
      var sublayers = layer.options.named_map.layers;
      _(sublayers).each(function (sub, i) {
        legends.push(self._createLegendView(sub, layerView.getSubLayer(i)));
      });
    } else {
      legends.push(this._createLegendView(layer, layerView));
    }
    return _.compact(legends).reverse();
  },

  addOverlay: function (overlay) {
    overlay.map = this.map;

    var v = Overlay.create(overlay.type, this, overlay);

    if (v) {
      // Save tiles loader view for later
      if (overlay.type == 'loader') {
        this.loader = v;
      }

      this.mapView.addOverlay(v);

      this.overlays.push(v);

      v.bind('clean', function () {
        for (var i in this.overlays) {
          var o = this.overlays[i];
          if (v.cid === o.cid) {
            this.overlays.splice(i, 1);
            return;
          }
        }
      }, this);
    }
    return v;
  },

  // change vizjson based on options
  _applyOptionsToVizJSON: function (vizjson, opt) {
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

    function search_overlay (name) {
      if (!vizjson.overlays) return null;
      for (var i = 0; i < vizjson.overlays.length; ++i) {
        if (vizjson.overlays[i].type === name) {
          return vizjson.overlays[i];
        }
      }
    }

    function remove_overlay (name) {
      if (!vizjson.overlays) return;
      for (var i = 0; i < vizjson.overlays.length; ++i) {
        if (vizjson.overlays[i].type === name) {
          vizjson.overlays.splice(i, 1);
          return;
        }
      }
    }

    this.infowindow = opt.infowindow;
    this.tooltip = opt.tooltip;

    if (opt.https) {
      this.https = true;
    }

    if (opt.gmaps_base_type) {
      this.gmaps_base_type = opt.gmaps_base_type;
    }

    if (opt.gmaps_style) {
      this.gmaps_style = opt.gmaps_style;
    }

    this.mobile = this.isMobileDevice();

    if (!opt.tiles_loader) {
      remove_overlay('loader');
    }

    if (!opt.loaderControl) {
      remove_overlay('loader');
    }

    if (opt.searchControl !== undefined) {
      opt.search = opt.searchControl;
    }

    if (!search_overlay('search') && opt.search) {
      vizjson.overlays.push({
        type: 'search',
        order: 3
      });
    }

    if ((opt.title && vizjson.title) || (opt.description && vizjson.description)) {
      if (!search_overlay('header')) {
        vizjson.overlays.unshift({
          type: 'header',
          order: 1,
          shareable: opt.shareable,
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
          type: 'layer_selector'
        });
      }
    }

    vizjson.overlays.push({
      type: 'attribution'
    });

    if (opt.zoomControl !== undefined && !opt.zoomControl) {
      remove_overlay('zoom');
    }

    if (opt.search !== undefined && !opt.search) {
      remove_overlay('search');
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
    if ( !isNaN(center_lat) && !isNaN(center_lon)) {
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

    if ( !isNaN(sw_lat) && !isNaN(sw_lon) && !isNaN(ne_lat) && !isNaN(ne_lon)) {
      vizjson.bounds = [
        [ sw_lat, sw_lon ],
        [ ne_lat, ne_lon ]
      ];
    }

    if (vizjson.layers.length > 1) {
      var token = opt.auth_token;
      function _applyLayerOptions (layers) {
        for (var i = 1; i < layers.length; ++i) {
          var o = layers[i].options;
          o.no_cdn = opt.no_cdn;
          o.force_cors = opt.force_cors;
          if (token) {
            o.auth_token = token;
          }
        }
      }
      _applyLayerOptions(vizjson.layers);
    }

    // Force using GMaps ?
    if ((this.gmaps_base_type) && (vizjson.map_provider === 'leaflet')) {
      // Check if base_type is correct
      var typesAllowed = ['roadmap', 'gray_roadmap', 'dark_roadmap', 'hybrid', 'satellite', 'terrain'];
      if (_.contains(typesAllowed, this.gmaps_base_type)) {
        if (vizjson.layers) {
          vizjson.layers[0].options.type = 'GMapsBase';
          vizjson.layers[0].options.base_type = this.gmaps_base_type;
          vizjson.layers[0].options.name = this.gmaps_base_type;

          if (this.gmaps_style) {
            vizjson.layers[0].options.style = typeof this.gmaps_style === 'string' ? JSON.parse(this.gmaps_style) : this.gmaps_style;
          }

          vizjson.map_provider = 'googlemaps';
          vizjson.layers[0].options.attribution = ''; // GMaps has its own attribution
        } else {
          log.error('No base map loaded. Using Leaflet.');
        }
      } else {
        log.error('GMaps base_type "' + this.gmaps_base_type + ' is not supported. Using leaflet.');
      }
    }
  },

  createLayer: function (layerData) {
    var layerModel = Layers.create(layerData.type || layerData.kind, this, layerData);
    return this.mapView.createLayer(layerModel);
  },

  _getSqlApi: function (attrs) {
    attrs = attrs || {};
    var port = attrs.sql_api_port;
    var domain = attrs.sql_api_domain + (port ? ':' + port : '');
    var protocol = attrs.sql_api_protocol;
    var version = 'v1';
    if (domain.indexOf('cartodb.com') !== -1) {
      protocol = 'http';
      domain = 'cartodb.com';
      version = 'v2';
    }

    var sql = new SQL({
      user: attrs.user_name,
      protocol: protocol,
      host: domain,
      version: version
    });

    return sql;
  },

  _addLoading: function (layerView) {
    if (layerView) {
      var self = this;

      var loadingTiles = function () {
        self.loadingTiles();
      };

      var loadTiles = function () {
        self.loadTiles();
      };

      layerView.bind('loading', loadingTiles);
      layerView.bind('load', loadTiles);
    }
  },

  loadingTiles: function () {
    if (this.loader) {
      this.loader.show();
    }
    if (this.layersLoading === 0) {
      this.trigger('loading');
    }
    this.layersLoading++;
  },

  loadTiles: function () {
    if (this.loader) {
      this.loader.hide();
    }
    this.layersLoading--;
    // check less than 0 because loading event sometimes is
    // thrown before visualization creation
    if (this.layersLoading <= 0) {
      this.layersLoading = 0;
      this.trigger('load');
    }
  },

  throwError: function (msg, lyr) {
    log.error(msg);
    var self = this;
    _.defer(function () {
      self.trigger('error', msg, lyr);
    });
  },

  error: function (fn) {
    return this.bind('error', fn);
  },

  done: function (fn) {
    return this.bind('done', fn);
  },

  // public methods
  //

  // get the native map used behind the scenes
  getNativeMap: function () {
    return this.mapView.getNativeMap();
  },

  // returns an array of layers
  // TODO: Rename to getLayerViews
  getLayers: function () {
    var self = this;
    return _.compact(this.map.layers.map(function (layer) {
      return self.mapView.getLayerViewByLayerCid(layer.cid);
    }));
  },

  getOverlays: function () {
    return this.overlays;
  },

  getOverlay: function (type) {
    return _(this.overlays).find(function (v) {
      return v.type == type;
    });
  },

  getOverlaysByType: function (type) {
    return _(this.overlays).filter(function (v) {
      return v.type == type;
    });
  },

  _onResize: function () {
    $(window).unbind('resize', this._onResize);

    var self = this;
    // This timeout is necessary due to GMaps needs time
    // to load tiles and recalculate its bounds :S
    setTimeout(function () {
      self.centerMapToOrigin();
    }, 150);
  },

  isMobileDevice: function () {
    return /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}, {
  /**
   * adds an infowindow to the map controlled by layer events.
   * it enables interaction and overrides the layer interacivity
   * ``fields`` array of column names
   * ``map`` native map object, leaflet of gmaps
   * ``layer`` cartodb layer (or sublayer)
   */
  addInfowindow: function (map, layer, fields, opts) {
    var options = _.defaults(opts || {}, {
      infowindowTemplate: INFOWINDOW_TEMPLATE.light,
      templateType: 'mustache',
      triggerEvent: 'featureClick',
      templateName: 'light',
      extraFields: [],
      cursorInteraction: true
    });

    if (!map) throw new Error('map is not valid');
    if (!layer) throw new Error('layer is not valid');
    if (!fields && fields.length === undefined) throw new Error('fields should be a list of strings');

    var f = [];
    fields = fields.concat(options.extraFields);
    for (var i = 0; i < fields.length; ++i) {
      f.push({ name: fields, order: i});
    }

    var infowindowModel = new InfowindowModel({
      fields: f,
      template_name: options.templateName
    });

    var infowindow = new Infowindow({
      model: infowindowModel,
      mapView: map.viz.mapView,
      template: new Template({
        template: options.infowindowTemplate,
        type: options.templateType
      }).asFunction()
    });

    map.viz.mapView.addInfowindow(infowindow);

    layer.bind(options.triggerEvent, function (e, latlng, pos, data, layer) {
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
        content: {
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
    infowindow.bind('clean', function () {
      layer.unbind(options.triggerEvent, null, infowindow);
    });

    if (options.cursorInteraction) {
      Vis.addCursorInteraction(map, layer);
    }

    return infowindow;
  },

  addCursorInteraction: function (map, layer) {
    var mapView = map.viz.mapView;
    layer.bind('mouseover', function () {
      mapView.setCursor('pointer');
    });

    layer.bind('mouseout', function (m, layer) {
      mapView.setCursor('auto');
    });
  },

  removeCursorInteraction: function (map, layer) {
    var mapView = map.viz.mapView;
    layer.unbind(null, null, mapView);
  }
});

module.exports = Vis;
