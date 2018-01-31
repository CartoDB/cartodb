var carto = require('cartodb.js');

/**
 * Creates a default fallback map, to be used when an user don't have any own map visualizations.
 *
 * @param opts {Object} config
 *   el: {String,HTMLElement} id to element where to render map (w/o '#' prefix) or a HTMLElement node
 * @returns {Object} a new created Leaflet map
 */
module.exports = function (opts) {
  var map = carto.createVis(opts.el, {
    version: '0.1.0',
    scrollwheel: false,
    zoom: 6,
    map_provider: 'leaflet',
    center: [40.7127837, -74.0059413], // New York
    layers: [{
      options: {
        urlTemplate: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/rastertiles/voyager_nolabels/{z}/{x}/{y}.png'
      },
      type: 'tiled'
    }],
    datasource: {
      user_name: 'documentation', // This could be any user controlled by CARTO
      maps_api_template: 'http://{user}.cartodb.com:80',
      force_cors: true,
      stat_tag: '84ec6844-4b4b-11e5-9c1d-080027880ca6'
    }
  });

  return map;
};
