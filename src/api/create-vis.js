var _ = require('underscore');
var VisView = require('../vis/vis-view');
var VisModel = require('../vis/vis');
var Loader = require('../core/loader');
var VizJSON = require('./vizjson');
var config = require('../cdb.config');

var DEFAULT_OPTIONS = {
  tiles_loader: true,
  loaderControl: true,
  infowindow: true,
  tooltip: true,
  logo: true,
  show_empty_infowindow_fields: false,
  interactiveFeatures: false
};

var createVis = function (el, vizjson, options) {
  if (typeof el === 'string') {
    el = document.getElementById(el);
  }
  if (!el) {
    throw new TypeError('a valid DOM element or selector must be provided');
  }
  if (!vizjson) {
    throw new TypeError('a vizjson URL or object must be provided');
  }

  var isProtocolHTTPs = window && window.location.protocol && window.location.protocol === 'https:';
  options = _.defaults(options || {}, DEFAULT_OPTIONS);

  var visModel = new VisModel({
    apiKey: options.apiKey,
    authToken: options.authToken,
    showEmptyInfowindowFields: options.show_empty_infowindow_fields === true,
    https: isProtocolHTTPs || options.https === true,
    interactiveFeatures: options.interactiveFeatures
  });

  if (typeof vizjson === 'string') {
    var url = vizjson;
    Loader.get(url, function (vizjson) {
      if (vizjson) {
        loadVizJSON(el, visModel, vizjson, options);
      } else {
        throw new Error('error fetching viz.json file');
      }
    });
  } else {
    loadVizJSON(el, visModel, vizjson, options);
  }

  if (options.mapzenApiKey) {
    config.set('mapzenApiKey', options.mapzenApiKey);
  }

  return visModel;
};

var loadVizJSON = function (el, visModel, vizjsonData, options) {
  var vizjson = new VizJSON(vizjsonData);
  applyOptionsToVizJSON(vizjson, options);

  var showLegends = true;
  if (_.isBoolean(options.legends)) {
    showLegends = options.legends;
  } else if (vizjson.options && _.isBoolean(vizjson.options.legends)) {
    showLegends = vizjson.options.legends;
  }

  var showLayerSelector = true;
  if (_.isBoolean(options.layer_selector)) {
    showLayerSelector = options.layer_selector;
  } else if (vizjson.options && _.isBoolean(vizjson.options.layer_selector)) {
    showLayerSelector = vizjson.options.layer_selector;
  }

  var layerSelectorEnabled = true;
  if (_.isBoolean(options.layerSelectorEnabled)) {
    layerSelectorEnabled = options.layerSelectorEnabled;
  }

  visModel.set({
    title: vizjson.title,
    description: vizjson.description,
    https: visModel.get('https') || vizjson.https === true
  });

  visModel.setSettings({
    showLegends: showLegends,
    showLayerSelector: showLayerSelector,
    layerSelectorEnabled: layerSelectorEnabled
  });

  new VisView({ // eslint-disable-line
    el: el,
    model: visModel,
    settingsModel: visModel.settings
  });

  visModel.load(vizjson);

  if (!options.skipMapInstantiation) {
    visModel.instantiateMap();
  }
};

var applyOptionsToVizJSON = function (vizjson, options) {
  vizjson.options = vizjson.options || {};
  vizjson.options.scrollwheel = options.scrollwheel || vizjson.options.scrollwheel;

  if (!options.tiles_loader || !options.loaderControl) {
    vizjson.removeLoaderOverlay();
  }

  if (options.searchControl === true) {
    vizjson.addSearchOverlay();
  } else if (options.searchControl === false) {
    vizjson.removeSearchOverlay();
  }

  if ((options.title && vizjson.title) || (options.description && vizjson.description)) {
    vizjson.addHeaderOverlay(options.title, options.description, options.shareable);
  }

  if (options.zoomControl !== undefined && !options.zoomControl) {
    vizjson.removeZoomOverlay();
  }

  if (options.logo === false) {
    vizjson.removeLogoOverlay();
  }

  if (_.has(options, 'vector')) {
    vizjson.setVector(options.vector);
  }

  // if bounds are present zoom and center will not taken into account
  var zoom = parseInt(options.zoom, 10);
  if (!isNaN(zoom)) {
    vizjson.setZoom(zoom);
  }

  // Center coordinates?
  var center_lat = parseFloat(options.center_lat);
  var center_lon = parseFloat(options.center_lon);
  if (!isNaN(center_lat) && !isNaN(center_lon)) {
    vizjson.setCenter([center_lat, center_lon]);
  }

  // Center object
  if (options.center !== undefined) {
    vizjson.setCenter(options.center);
  }

  // Bounds?
  var sw_lat = parseFloat(options.sw_lat);
  var sw_lon = parseFloat(options.sw_lon);
  var ne_lat = parseFloat(options.ne_lat);
  var ne_lon = parseFloat(options.ne_lon);

  if (!isNaN(sw_lat) && !isNaN(sw_lon) && !isNaN(ne_lat) && !isNaN(ne_lon)) {
    vizjson.setBounds([
      [ sw_lat, sw_lon ],
      [ ne_lat, ne_lon ]
    ]);
  }

  if (options.gmaps_base_type) {
    vizjson.enforceGMapsBaseLayer(options.gmaps_base_type, options.gmaps_style);
  }
};

module.exports = createVis;
