var cdb = require('cartodb.js-v3');
var _ = require('underscore-cdb-v3');

/**
 * Creates a default fallback map, to be used when an user don't have any own map visualizations.
 *
 * @param opts {Object} config
 *   el: {String,HTMLElement} id to element where to render map (w/o '#' prefix) or a HTMLElement node
 *   baselayer: {Object} as an item defined in app_config.yml (basemaps key)
 * @returns {Object} a new created Leaflet map
 */
module.exports = function(opts) {
  var provider = 'leaflet';
  var type = 'tiled';
  if (!opts.baselayer.urlTemplate) {
    provider = 'googlemaps';
    type = 'GMapsBase';
  }
  var map = cdb.createVis(opts.el, {
    'version': '0.1.0',
    'title': 'default',
    'scrollwheel': opts.scrollwheel !== undefined ? opts.scrollwheel : false,
    'zoom': 6,
    map_provider: provider,
    center: [40.7127837, -74.0059413], // NY
    layers: [ _.extend({ type: type }, opts.baselayer) ]
  });

  return map;
};
