/* global google */
var GoogleCartoDBLayerGroupClass = require('../../../../src/geo/gmaps/gmaps-cartodb-layer-group-view');
var cartoLayerGroupViewTests = require('../shared-tests-for-carto-layer-group');

describe('gmaps-cartodb-layer-group-view', function () {
  /**
   * Helper function used to get a google map and a container in the shared tests.
   */
  function setUp () {
    // Create a leaflet map inside a container
    var container = document.createElement('div');
    container.setAttribute('id', 'map');
    container.style.height = '200px';
    document.body.appendChild(container);
    var googleMap = new google.maps.Map(document.getElementById('map'), {
      zoom: 4,
      center: { lat: 47.84808037632246, lng: 14.2822265625 }
    });
    return {
      container: container,
      nativeMap: googleMap
    };
  }

  /**
   * Helper function used to get the tiles in the shared tests
   */
  function getTileUrl (layerGroupView) {
    return layerGroupView.options.tiles[0].replace('{s}', '0');
  }

  /**
   * Gmaps events and Leaflet events are different.
   */
  var event = {
    da: { x: 121.8125, y: 94.56249999999997 },
    data: { name: 'fakeCityName', cartodb_id: 123 },
    e: { type: 'mousemove' },
    latLng: { lat: function () { return 42.48830197960228; }, lng: function () { return -8.701171875; } },
    layer: 0,
    pixel: { x: 243, y: 274 }
  };

  cartoLayerGroupViewTests(setUp, GoogleCartoDBLayerGroupClass, getTileUrl, event);
});
