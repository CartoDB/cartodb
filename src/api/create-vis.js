var $ = require('jquery');
var _ = require('underscore');
var Vis = require('../vis/vis');
var Loader = require('../core/loader');
var VizJSON = require('./vizjson');

var DEFAULT_OPTIONS = {
  tiles_loader: true,
  loaderControl: true,
  infowindow: true,
  tooltip: true,
  time_slider: true
};

var createVis = function (el, vizjson, options, callback) {
  if (!el) {
    throw new TypeError('a DOM element must be provided');
  }
  if (!vizjson) {
    throw new TypeError('a vizjson URL or object must be provided');
  }

  var args = arguments;
  var fn = args[args.length - 1];

  if (_.isFunction(fn)) {
    callback = fn;
  }
  if (typeof el === 'string') {
    el = document.getElementById(el);
  }

  options = _.defaults(options || {}, DEFAULT_OPTIONS);

  var vis = new Vis({
    el: el
  });

  if (callback) {
    vis.done(callback);
  }

  if (typeof vizjson === 'string') {
    var url = vizjson;
    Loader.get(url, function (vizjson) {
      if (vizjson) {
        loadVizJSON(vis, vizjson, options);
      } else {
        throw new Error('error fetching viz.json file');
      }
    });
  } else {
    loadVizJSON(vis, vizjson, options);
  }

  return vis;
};

var loadVizJSON = function (vis, vizjsonData, options) {
  var vizjson = new VizJSON(vizjsonData);
  applyOptionsToVizJSON(vizjson, options);
  vis.load(vizjson);
  if (!options.skipMapInstantiation) {
    vis.instantiateMap();
  }
};

var applyOptionsToVizJSON = function (vizjson, options) {
  vizjson.scrollwheel = options.scrollwheel || vizjson.scrollwheel;

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

  if (options.layer_selector) {
    vizjson.addLayerSelectorOverlay();
  }

  if (options.zoomControl !== undefined && !options.zoomControl) {
    vizjson.removeZoomOverlay();
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
