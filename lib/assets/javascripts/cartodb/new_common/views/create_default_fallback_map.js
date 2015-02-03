var L = require('leaflet');

/**
 * Creates a default fallback map, expected use-case is when an user don't have any own map visualizations that can be 
 * used.
 * 
 * @param L {Object} instance of Leaflet
 * @param opts {Object} config
 *   el: {String,HTMLElement} id to element where to render map (w/o '#' prefix) or a HTMLElement node
 *   basemapTemplateUrl: {String}
 * @returns {Object} a new created Leaflet map
 */
module.exports = function(opts) {
  var map = L.map(opts.el, {
    scrollWheelZoom: false,
    zoomControl: false,
    center: [40.7127837, -74.0059413], //NY
    zoom: 6,
    maxZoom: 15
  });

  var layer = L.tileLayer(opts.basemapTemplateUrl);
  map.addLayer(layer); 
  
  return map;
};
