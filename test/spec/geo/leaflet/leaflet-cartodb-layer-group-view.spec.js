/* global L */
var cartoLayerGroupViewTests = require('../shared-tests-for-carto-layer-group');
var LeafletCartoDBLayerGroupView = require('../../../../src/geo/leaflet/leaflet-cartodb-layer-group-view');

describe('leaflet-cartodb-layer-group-view', function () {
  /**
   * Helper function used to get a google map and a container in the shared tests.
   */
  function setUp () {
    // Create a leaflet map inside a container
    var container = document.createElement('div');
    container.setAttribute('id', 'map');
    container.style.height = '200px';
    document.body.appendChild(container);
    var leafletMap = L.map('map').setView([47.84808037632246, 14.2822265625], 4);
    return {
      container: container,
      nativeMap: leafletMap
    };
  }

  /**
   * Helper function used to get the tiles in the shared tests
   */
  function getTileUrl (layerGroupView) {
    return layerGroupView.leafletLayer._url.replace('{s}', '0');
  }

  /**
   * Gmaps events and Leaflet events are different.
   */
  var event = {
    containerPoint: { x: 264, y: 309 },
    data: {
      name: 'fakeCityName',
      cartodb_id: 123
    },
    e: {
      clientX: 696,
      clientY: 325,
      type: 'mousemove'
    },
    latlng: {
      lat: 42.293564192170095,
      lng: -8.173828125000002
    },
    layer: 0,
    layerPoint: { x: 264, y: 309 },
    originalEvent: {},
    target: {},
    type: 'mouseMove'
  };

  cartoLayerGroupViewTests(setUp, LeafletCartoDBLayerGroupView, getTileUrl, event);
});
