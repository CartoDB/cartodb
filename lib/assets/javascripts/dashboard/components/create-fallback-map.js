/* global google */
const L = require('leaflet');
const NEW_YORK = [40.7127837, -74.0059413];

/**
 * Creates a default fallback map, to be used when an user doesn't have a public map.
 *
 * @param opts {Object} config
 *   el: {HTMLElement} an HTMLElement node where to draw the map
 */
module.exports = function (opts) {
  if (opts.basemap.urlTemplate) {
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

    let url = opts.basemap.urlTemplate;

    if (window.devicePixelRatio > 1) {
      url = opts.basemap.urlTemplate2x || url;
    }

    L.tileLayer(url, {
      attribution: opts.basemap.attribution
    }).addTo(map);
  } else if (opts.basemap.className === 'googlemaps' && google.maps !== undefined) {
    const map = new google.maps.Map(opts.el, { // eslint-disable-line
      center: { lat: NEW_YORK[0], lng: NEW_YORK[1] },
      zoom: 6,
      draggable: false,
      scrollwheel: false,
      panControl: false,
      zoomControl: false,
      streetViewControl: false,
      maxZoom: 6,
      minZoom: 6,
      mapTypeControl: false,
      mapTypeId: opts.basemap.baseType || google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'all',
          elementType: 'labels',
          stylers: [
            { visibility: 'off' }
          ]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [
            { visibility: 'off' }
          ]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [
            { visibility: 'off' }
          ]
        }
      ]
    });
  }
};
