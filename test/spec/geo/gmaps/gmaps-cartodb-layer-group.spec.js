/* global google */
var GoogleCartoDBLayerGroupClass = require('../../../../src/geo/gmaps/gmaps-cartodb-layer-group-view');
var cartoLayerGroupViewTests = require('../shared-tests-for-carto-layer-group');
var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer');
var LayersCollection = require('../../../../src/geo/map/layers');
var CartoDBLayerGroup = require('../../../../src/geo/cartodb-layer-group');

describe('gmaps-cartodb-layer-group-view', function () {
  /**
   * Helper function used to get a google map in the shared tests.
   */
  function createNativeMap (container) {
    // Create a leaflet map inside a container
    container.setAttribute('id', 'map');
    container.style.height = '200px';
    document.body.appendChild(container);
    var googleMap = new google.maps.Map(document.getElementById('map'), {
      zoom: 4,
      center: { lat: 47.84808037632246, lng: 14.2822265625 }
    });
    return googleMap;
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

  // -- Shared tests for carto layer group
  cartoLayerGroupViewTests(createNativeMap, GoogleCartoDBLayerGroupClass, getTileUrl, event);

  // -- Google maps specific tests
  describe('GMapsCartoDBLayerGroupView', function () {
    var nativeMap;
    var container;
    var cartoDbLayer0;
    var cartoDbLayer1;
    var layerGroupView0;
    var layerGroupView1;

    var layerGroupModelMock;
    var layersCollection;

    var engineMock = {
      on: jasmine.createSpy('on')
    };

    var mapModelMock = {
      on: jasmine.createSpy('on'),
      isFeatureInteractivityEnabled: jasmine.createSpy('isFeatureInteractivityEnabled').and.returnValue(false)
    };

    beforeEach(function () {
      container = document.createElement('div');
      nativeMap = createNativeMap(container);

      cartoDbLayer0 = new CartoDBLayer({}, { engine: engineMock });
      cartoDbLayer1 = new CartoDBLayer({}, { engine: engineMock });

      layersCollection = new LayersCollection([cartoDbLayer0, cartoDbLayer1]);

      layerGroupModelMock = new CartoDBLayerGroup({
        urls: {
          'subdomains': [0, 1, 2, 3],
          'tiles': 'http://{s}.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/{layerIndexes}/{z}/{x}/{y}.png',
          'grids': [
            [
              'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json',
              'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/{z}/{x}/{y}.grid.json'
            ],
            [
              'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://1.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://2.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json',
              'http://3.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/{z}/{x}/{y}.grid.json'
            ]
          ],
          'attributes': [
            'http://ashbu.cartocdn.com/documentation/api/v1/map/0123456789/0/attributes',
            'http://ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1/attributes'
          ]
        },
        indexOfLayersInWindshaft: [1, 2]
      }, {
        layersCollection: layersCollection
      });

      layerGroupView0 = new GoogleCartoDBLayerGroupClass(layerGroupModelMock, { nativeMap: nativeMap, mapModel: mapModelMock });
      layerGroupView1 = new GoogleCartoDBLayerGroupClass(layerGroupModelMock, { nativeMap: nativeMap, mapModel: mapModelMock });
      nativeMap.overlayMapTypes.push(layerGroupView0);
      nativeMap.overlayMapTypes.push(layerGroupView1);
    });

    describe('._getOverlayIndex', function () {
      it('returns the index of the given layour group', function () {
        expect(layerGroupView0._getOverlayIndex()).toEqual(0);
        expect(layerGroupView1._getOverlayIndex()).toEqual(1);
      });
    });

    describe('._refreshView', function () {
      it('sets the layer group in the same position', function () {
        layerGroupView0._refreshView();

        expect(nativeMap.overlayMapTypes.getAt(0)).toEqual(layerGroupView0);
        expect(nativeMap.overlayMapTypes.getAt(1)).toEqual(layerGroupView1);
      });
    });

    describe('.remove', function () {
      it('removes the correct layer group', function () {
        layerGroupView0.remove();

        expect(nativeMap.overlayMapTypes.getLength()).toEqual(1);
        expect(nativeMap.overlayMapTypes.getAt(0)).toEqual(layerGroupView1);
      });
    });

    afterEach(function () {
      document.body.removeChild(container);
    });
  });
});
