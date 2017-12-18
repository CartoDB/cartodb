/* global google */

var CartoDBLayer = require('../../../../src/geo/map/cartodb-layer.js');
var LayersCollection = require('../../../../src/geo/map/layers.js');
var CartoDBLayerGroup = require('../../../../src/geo/cartodb-layer-group.js');
var LeafletCartoDBLayerGroupView = require('../../../../src/geo/gmaps/gmaps-cartodb-layer-group-view');

describe('gmaps-cartodb-layer-group-view', function () {
  var container;
  var googleMap;

  var cartoDbLayer0;
  var cartoDbLayer1;
  var layerGroupView;

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
    // Create a leaflet map inside a container
    container = document.createElement('div');
    container.setAttribute('id', 'map');
    container.style.height = '200px';
    document.body.appendChild(container);
    googleMap = new google.maps.Map(document.getElementById('map'), {
      zoom: 4,
      center: { lat: 47.84808037632246, lng: 14.2822265625 }
    });

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
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  it('should set the right tile url into the innter leaflet Layer', function () {
    layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
      nativeMap: googleMap,
      mapModel: mapModelMock
    });
    expect(layerGroupView.options.tiles[0]).toEqual('http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png');
  });

  describe('interactivity', function () {
    it('should not enable interaction when there are no interactive layers ', function () {
      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });

      expect(layerGroupView.interaction.length).toEqual(0);
    });

    it('should enable interaction when there are no interactive layers but map model has enabled interaction ', function () {
      mapModelMock.isFeatureInteractivityEnabled.and.returnValue(true);

      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });

      expect(layerGroupView.interaction.length).toEqual(2);
    });

    it('should enable interaction when there are interactive layers ', function () {
      mapModelMock.isFeatureInteractivityEnabled.and.returnValue(false);
      spyOn(cartoDbLayer0, 'isInteractive').and.returnValue(true);

      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });

      expect(layerGroupView.interaction.length).toEqual(1);
    });

    it('should disable interaction for the hidden layers', function () {
      mapModelMock.isFeatureInteractivityEnabled.and.returnValue(false);
      spyOn(cartoDbLayer0, 'isInteractive').and.returnValue(true);
      spyOn(cartoDbLayer1, 'isInteractive').and.returnValue(true);
      spyOn(cartoDbLayer1, 'isVisible').and.returnValue(false);

      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });

      expect(layerGroupView.interaction.length).toEqual(1);
    });
  });

  describe('event firing', function () {
    it('should trigger a "featureOver" event when interactivity class triggers a mousemove event with some data', function (done) {
      spyOn(cartoDbLayer0, 'isInteractive').and.returnValue(true);
      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });

      layerGroupView.on('featureOver', function (event) {
        expect(event.layer).toEqual(cartoDbLayer0);
        expect(event.layerIndex).toEqual(0);
        // Skip this test since the container point is computed with a wrong window offset.
        // expect(event.position).toEqual({ x: 264, y: 309 });
        // expect(event.latlng).toEqual([42.293564192170095, -8.173828125000002]);
        expect(event.feature.name).toEqual('fakeCityName');
        expect(event.feature.cartodb_id).toEqual(123);
        done();
      });

      var eventData = {
        da: { x: 121.8125, y: 94.56249999999997 },
        data: { name: 'fakeCityName', cartodb_id: 123 },
        e: { type: 'mousemove' },
        latLng: { lat: function () { return 42.48830197960228; }, lng: function () { return -8.701171875; } },
        layer: 0,
        pixel: { x: 243, y: 274 }
      };

      layerGroupView.interaction[0]._eventEmitter.dispatchEvent('mousemove', eventData);
    });

    it('should trigger a "featureClick" event when interactivity class triggers a "click" event', function (done) {
      spyOn(cartoDbLayer0, 'isInteractive').and.returnValue(true);
      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });

      layerGroupView.on('featureClick', function (event) {
        expect(event.layer).toEqual(cartoDbLayer0);
        expect(event.layerIndex).toEqual(0);
        // Skip this test since the container point is computed with a wrong window offset.
        // expect(event.position).toEqual({ x: 264, y: 309 });
        // expect(event.latlng).toEqual([42.293564192170095, -8.173828125000002]);
        expect(event.feature.name).toEqual('fakeCityName');
        expect(event.feature.cartodb_id).toEqual(123);
        done();
      });

      var eventData = {
        da: { x: 121.8125, y: 94.56249999999997 },
        data: { name: 'fakeCityName', cartodb_id: 123 },
        e: { type: 'click' },
        latLng: { lat: function () { return 42.48830197960228; }, lng: function () { return -8.701171875; } },
        layer: 0,
        pixel: { x: 243, y: 274 }
      };

      layerGroupView.interaction[0]._eventEmitter.dispatchEvent('click', eventData);
    });

    it('should trigger a "featureOut" event when interactivity triggers a featureOut event', function (done) {
      spyOn(cartoDbLayer0, 'isInteractive').and.returnValue(true);
      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });

      layerGroupView.on('featureOut', function (event) {
        expect(event.layer).toEqual(cartoDbLayer0);
        expect(event.layerIndex).toEqual(0);
        // Skip this test since the container point is computed with a wrong window offset.
        // expect(event.position).toEqual({ x: 264, y: 309 });
        // expect(event.latlng).toEqual([42.293564192170095, -8.173828125000002]);
        done();
      });

      var eventData = {
        da: { x: 121.8125, y: 94.56249999999997 },
        data: { name: 'fakeCityName', cartodb_id: 123 },
        e: { type: 'mousemove' },
        latLng: { lat: function () { return 42.48830197960228; }, lng: function () { return -8.701171875; } },
        layer: 0,
        pixel: { x: 243, y: 274 }
      };

      layerGroupView.interaction[0]._eventEmitter.dispatchEvent('featureout', eventData);
    });

    it('should trigger a "featureError" event when interactivity triggers a featureOut event', function (done) {
      pending('Not implemented yet');
      spyOn(cartoDbLayer0, 'isInteractive').and.returnValue(true);
      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });

      layerGroupView.on('featureError', function (event) {
        expect(event.layer).toEqual(cartoDbLayer0);
        expect(event.layerIndex).toEqual(0);
        // Skip this test since the container point is computed with a wrong window offset.
        // expect(event.position).toEqual({ x: 264, y: 309 });
        // expect(event.latlng).toEqual([42.293564192170095, -8.173828125000002]);
        done();
      });

      var eventData = {
        containerPoint: { x: 264, y: 309 },
        data: {},
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
        type: 'mousemove'
      };

      layerGroupView.interaction[0]._eventEmitter.dispatchEvent('error', eventData);
    });
  });

  describe('when new urls are set', function () {
    it('should set the URL template', function () {
      layerGroupModelMock.set('urls', {
        'subdomains': [0, 1, 2, 3],
        'tiles': 'http://{s}.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/{layerIndexes}/{z}/{x}/{y}.png',
        'grids': [
          [
            'http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json',
            'http://1.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json',
            'http://2.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json',
            'http://3.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/{z}/{x}/{y}.grid.json'
          ],
          [
            'http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json',
            'http://1.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json',
            'http://2.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json',
            'http://3.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/{z}/{x}/{y}.grid.json'
          ]
        ],
        'attributes': [
          'http://ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/attributes',
          'http://ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1/attributes'
        ]
      });
      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });

      expect(layerGroupView.options.tiles[0]).toEqual('http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png');
    });
  });

  xdescribe("when there aren't tile URLS", function () {
    it('should fetch empty tiles', function () {
      pending('how to compare the empty gif against the tile url?');
      // TODO: how to compare the empty gif against the tile url?
      // var EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      layerGroupModelMock.set('urls', {
        'tiles': '',
        'grids': [],
        'attributes': [
          'http://ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/attributes'
        ]
      });

      layerGroupView = new LeafletCartoDBLayerGroupView(layerGroupModelMock, {
        nativeMap: googleMap,
        mapModel: mapModelMock
      });
    });
  });
});
