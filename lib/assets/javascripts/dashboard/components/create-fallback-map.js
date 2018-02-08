const L = require('leaflet');
const NEW_YORK = [40.7127837, -74.0059413];

/**
 * Creates a default fallback map, to be used when an user doesn't have a public map.
 *
 * @param opts {Object} config
 *   el: {HTMLElement} an HTMLElement node where to draw the map
 */
module.exports = function (opts) {
  const map = L.map(opts.el, {
    zoomControl: false,
    minZoom: 6,
    maxZoom: 6,
    scrollWheelZoom: false
  });

  map.setView(NEW_YORK, 6);

  map.dragging.disable();
  map.touchZoom.disable();
  map.doubleClickZoom.disable();

  map.attributionControl.setPrefix('');

  L.tileLayer(opts.basemap.url, {
    attribution: opts.basemap.attribution
  }).addTo(map);
};
