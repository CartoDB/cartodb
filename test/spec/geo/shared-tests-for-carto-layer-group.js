var CartoDBLayer = require('../../../src/geo/map/cartodb-layer.js');
var LayersCollection = require('../../../src/geo/map/layers.js');
var CartoDBLayerGroup = require('../../../src/geo/cartodb-layer-group.js');

module.exports = function (createNativeMap, CartoLayerGroupViewClass, getTileUrl, event) {
  var nativeMap;
  var container;
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
  });

  afterEach(function () {
    document.body.removeChild(container);
  });

  it('should set the right tile url', function () {
    layerGroupView = new CartoLayerGroupViewClass(layerGroupModelMock, {
      nativeMap: nativeMap,
      mapModel: mapModelMock
    });

    var actual = getTileUrl(layerGroupView);
    var expected = 'http://0.ashbu.cartocdn.com/documentation/api/v1/map/0123456789/1,2/{z}/{x}/{y}.png';

    expect(actual).toEqual(expected);
  });

  describe('interactivity', function () {
    it('should not enable interaction when there are no interactive layers ', function () {
      layerGroupView = new CartoLayerGroupViewClass(layerGroupModelMock, {
        nativeMap: nativeMap,
        mapModel: mapModelMock
      });

      expect(layerGroupView.interaction.length).toEqual(0);
    });

    it('should enable interaction when there are no interactive layers but map model has enabled interaction ', function () {
      mapModelMock.isFeatureInteractivityEnabled.and.returnValue(true);

      layerGroupView = new CartoLayerGroupViewClass(layerGroupModelMock, {
        nativeMap: nativeMap,
        mapModel: mapModelMock
      });

      expect(layerGroupView.interaction.length).toEqual(2); // 2 interactive layers
    });

    it('should enable interaction when there are interactive layers ', function () {
      mapModelMock.isFeatureInteractivityEnabled.and.returnValue(false);
      spyOn(cartoDbLayer0, 'isInteractive').and.returnValue(true);

      layerGroupView = new CartoLayerGroupViewClass(layerGroupModelMock, {
        nativeMap: nativeMap,
        mapModel: mapModelMock
      });

      expect(layerGroupView.interaction.length).toEqual(1);
    });

    it('should disable interaction for the hidden layers', function () {
      mapModelMock.isFeatureInteractivityEnabled.and.returnValue(false);
      spyOn(cartoDbLayer0, 'isInteractive').and.returnValue(true);
      spyOn(cartoDbLayer1, 'isInteractive').and.returnValue(true);
      spyOn(cartoDbLayer1, 'isVisible').and.returnValue(false);

      layerGroupView = new CartoLayerGroupViewClass(layerGroupModelMock, {
        nativeMap: nativeMap,
        mapModel: mapModelMock
      });

      expect(layerGroupView.interaction.length).toEqual(1);
    });
  });

  describe('event firing', function () {
    beforeEach(function () {
      spyOn(cartoDbLayer0, 'isInteractive').and.returnValue(true);
      layerGroupView = new CartoLayerGroupViewClass(layerGroupModelMock, {
        nativeMap: nativeMap,
        mapModel: mapModelMock
      });
    });
    it('should trigger a "featureOver" event when interactivity class triggers a mousemove event with some data', function (done) {
      event.e.type = 'mousemove';

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

      layerGroupView.interaction[0]._eventEmitter.dispatchEvent('mousemove', event);
    });

    it('should trigger a "featureClick" event when interactivity class triggers a "click" event', function (done) {
      event.e.type = 'click';

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

      layerGroupView.interaction[0]._eventEmitter.dispatchEvent('click', event);
    });

    it('should trigger a "featureOut" event when interactivity triggers a featureOut event', function (done) {
      event.e.type = 'mousemove';

      layerGroupView.on('featureOut', function (event) {
        expect(event.layer).toEqual(cartoDbLayer0);
        expect(event.layerIndex).toEqual(0);
        // Skip this test since the container point is computed with a wrong window offset.
        // expect(event.position).toEqual({ x: 264, y: 309 });
        // expect(event.latlng).toEqual([42.293564192170095, -8.173828125000002]);
        done();
      });

      layerGroupView.interaction[0]._eventEmitter.dispatchEvent('featureout', event);
    });

    it('should trigger a "featureError" event when interactivity triggers a featureOut event', function (done) {
      pending('Not implemented yet');
      layerGroupView.on('featureError', function (event) {
        expect(event.layer).toEqual(cartoDbLayer0);
        expect(event.layerIndex).toEqual(0);
        // Skip this test since the container point is computed with a wrong window offset.
        // expect(event.position).toEqual({ x: 264, y: 309 });
        // expect(event.latlng).toEqual([42.293564192170095, -8.173828125000002]);
        done();
      });

      layerGroupView.interaction[0]._eventEmitter.dispatchEvent('error', event);
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
      layerGroupView = new CartoLayerGroupViewClass(layerGroupModelMock, {
        nativeMap: nativeMap,
        mapModel: mapModelMock
      });

      var actual = getTileUrl(layerGroupView);
      var expected = 'http://0.ashbu.cartocdn.com/documentation/api/v1/map/9876543210/1,2/{z}/{x}/{y}.png';
      expect(actual).toEqual(expected);
    });
  });

  describe("when there aren't tile URLS", function () {
    it('should fetch empty tiles', function () {
      layerGroupModelMock.set('urls', {
        'tiles': '',
        'grids': [],
        'attributes': [
          'http://ashbu.cartocdn.com/documentation/api/v1/map/9876543210/0/attributes'
        ]
      });

      layerGroupView = new CartoLayerGroupViewClass(layerGroupModelMock, {
        nativeMap: nativeMap,
        mapModel: mapModelMock
      });

      var actual = getTileUrl(layerGroupView);
      var expected = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

      expect(actual).toEqual(expected);
    });
  });
};
