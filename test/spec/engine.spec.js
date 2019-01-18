var $ = require('jquery');
var Engine = require('../../src/engine');
var WindshaftError = require('../../src/windshaft/error');
var MockFactory = require('../helpers/mockFactory');
var createEngine = require('../spec/fixtures/engine.fixture.js');
var FAKE_RESPONSE = require('./windshaft/response.mock');
var FAKE_ERROR_PAYLOAD = require('./windshaft/error.mock');
var CartoDBLayer = require('../../src/geo/map/cartodb-layer');
var Dataview = require('../../src/dataviews/dataview-model-base');
var Backbone = require('backbone');

describe('Engine', function () {
  var engineMock;

  beforeEach(function () {
    engineMock = createEngine({
      spyReload: false,
      username: 'fake-username'
    });
  });

  describe('Constructor', function () {
    it('should throw a descriptive error when called with no parameters', function () {
      expect(function () {
        new Engine(); // eslint-disable-line
      }).toThrowError('new Engine() called with no parameters');
    });
  });

  describe('events', function () {
    var spy;

    beforeEach(function () {
      spy = jasmine.createSpy('spy');
    });
    describe('on', function () {
      it('should register a callback thats called for "fake-event"', function () {
        engineMock.on('fake-event', spy);
        expect(spy).not.toHaveBeenCalled(); // Ensure the spy not has been called previosuly
        engineMock._eventEmmitter.trigger('fake-event');
        expect(spy).toHaveBeenCalled();
      });
    });
    describe('off', function () {
      it('should unregister a callback', function () {
        engineMock.on('fake-event', spy);
        expect(spy).not.toHaveBeenCalled(); // Ensure the spy not has been called previosuly
        engineMock._eventEmmitter.trigger('fake-event');
        expect(spy).toHaveBeenCalled();
        engineMock.off('fake-event', spy);
        engineMock._eventEmmitter.trigger('fake-event');
        expect(spy.calls.count()).toBe(1);
      });
    });
  });

  describe('.addLayer', function () {
    it('should add a layer', function () {
      var style = '#layer { marker-color: red; }';
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var layer = new CartoDBLayer({ source: source, style: style }, { engine: engineMock });
      expect(engineMock._layersCollection.length).toEqual(0);
      engineMock.addLayer(layer);
      expect(engineMock._layersCollection.length).toEqual(1);
      expect(engineMock._layersCollection.at(0)).toEqual(layer);
    });
  });

  describe('.removeLayer', function () {
    it('should remove a layer', function () {
      var style = '#layer { marker-color: red; }';
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var layer = new CartoDBLayer({ source: source, style: style }, { engine: engineMock });
      engineMock.addLayer(layer);
      engineMock.removeLayer(layer);
      expect(engineMock._layersCollection.length).toEqual(0);
    });
  });

  describe('.moveLayer', function () {
    it('should move a layer', function () {
      var style = '#layer { marker-color: red; }';
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var layer0 = new CartoDBLayer({ source: source, style: style }, { engine: engineMock });
      var layer1 = new CartoDBLayer({ source: source, style: style }, { engine: engineMock });
      engineMock.addLayer(layer0);
      engineMock.addLayer(layer1);
      expect(engineMock._layersCollection.at(0)).toEqual(layer0);
      expect(engineMock._layersCollection.at(1)).toEqual(layer1);
      engineMock.moveLayer(layer0, 1);
      expect(engineMock._layersCollection.at(1)).toEqual(layer0);
      expect(engineMock._layersCollection.at(0)).toEqual(layer1);
    });
  });

  describe('.addDataview', function () {
    it('should add a new dataview', function () {
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var dataview = new Dataview({ id: 'dataview1', source: source }, { map: {}, engine: engineMock });
      expect(engineMock._dataviewsCollection.length).toEqual(0);
      engineMock.addDataview(dataview);
      expect(engineMock._dataviewsCollection.length).toEqual(1);
      expect(engineMock._dataviewsCollection.at(0)).toEqual(dataview);
    });
  });

  describe('._buildParams', function () {
    it('should send client tag for analytics when environment is production', function () {
      var previousENVValue = __ENV__;
      __ENV__ = 'production';

      var params = engineMock._buildParams();
      expect(params.client).toBeDefined();

      __ENV__ = previousENVValue;
    });
  });

  describe('.reload', function () {
    var layer;

    beforeEach(function () {
      var style = '#layer { marker-color: red; }';
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      layer = new CartoDBLayer({ source: source, style: style }, { engine: engineMock });
    });

    it('should perform a request with the state encoded in a payload (no layers, no dataviews)', function (done) {
      spyOn($, 'ajax').and.callFake(function (params) {
        var actual = params.url;
        var expected = 'http://example.com/api/v1/map?config=%7B%22buffersize%22%3A%7B%22mvt%22%3A0%7D%2C%22layers%22%3A%5B%5D%2C%22dataviews%22%3A%7B%7D%2C%22analyses%22%3A%5B%5D%7D&api_key=' + engineMock.getApiKey();
        expect(actual).toEqual(expected);
        done();
      });
      engineMock.reload();
    });

    it('should perform a request with the state encoded in a payload (single layer)', function (done) {
      spyOn($, 'ajax').and.callFake(function (params) {
        var actual = params.url;
        var expected = 'http://example.com/api/v1/map?config=%7B%22buffersize%22%3A%7B%22mvt%22%3A0%7D%2C%22layers%22%3A%5B%7B%22type%22%3A%22mapnik%22%2C%22options%22%3A%7B%22cartocss_version%22%3A%222.1.0%22%2C%22source%22%3A%7B%22id%22%3A%22a1%22%7D%2C%22interactivity%22%3A%5B%22cartodb_id%22%5D%7D%7D%5D%2C%22dataviews%22%3A%7B%7D%2C%22analyses%22%3A%5B%7B%22id%22%3A%22a1%22%2C%22type%22%3A%22source%22%2C%22params%22%3A%7B%22query%22%3A%22SELECT%20*%20FROM%20table%22%7D%7D%5D%7D&api_key=' + engineMock.getApiKey();
        expect(actual).toEqual(expected);
        done();
      });

      engineMock.addLayer(layer);
      engineMock.reload();
    });

    describe('when using Promises', function () {
      it('should resolve when the server returns a successful response', function (done) {
        // Successfull server response
        spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });

        engineMock.reload().then(function (nothing) {
          expect(nothing).not.toBeDefined();
          done();
        });
      });

      it('should resolve consecutive calls when the server returns a successful response', function (done) {
        // Successfull server response
        spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });

        var counter = 0;
        var NUM_CALLS = 2;
        function _process (nothing) {
          expect(nothing).not.toBeDefined();
          counter++;
          (counter === NUM_CALLS) && done();
        }

        engineMock.reload().then(_process);
        engineMock.reload().then(_process);
      });

      it('should reject when the server returns an error response', function (done) {
        // Error server response
        spyOn($, 'ajax').and.callFake(function (params) { params.error(FAKE_ERROR_PAYLOAD); });

        engineMock.reload().catch(function (error) {
          expect(error instanceof WindshaftError).toBe(true);
          expect(error.message).toBe('Postgis Plugin: ERROR:  transform: couldnt project point (242 611 0): latitude or longitude exceeded limits.');
          done();
        });
      });

      it('should reject consecutive calls when the server returns an error response', function (done) {
        // Error server response
        spyOn($, 'ajax').and.callFake(function (params) { params.error(FAKE_ERROR_PAYLOAD); });

        var counter = 0;
        var NUM_CALLS = 2;
        function _process (error) {
          expect(error).toBeDefined();
          expect(error instanceof WindshaftError).toBe(true);
          expect(error.message).toBe('Postgis Plugin: ERROR:  transform: couldnt project point (242 611 0): latitude or longitude exceeded limits.');
          counter++;
          (counter === NUM_CALLS) && done();
        }

        engineMock.reload().catch(_process);
        engineMock.reload().catch(_process);
      });
    });

    describe('when using Callbacks', function () {
      it('should call successCallback when the server returns a successful response', function (done) {
        // Successfull server response
        spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
        // Attach the success callback to a spy.
        var successCallback = jasmine.createSpy('successCallback');

        engineMock.reload({ success: successCallback }).then(function () {
          expect(successCallback).toHaveBeenCalledWith();
          done();
        });
      });

      it('should call consecutive successCallbacks when the server returns a successful response', function (done) {
        // Successfull server response
        spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
        // Attach the success callbacks to a spy.
        var successCallbacks = [
          jasmine.createSpy('successCallback0'),
          jasmine.createSpy('successCallback1')
        ];

        var counter = 0;
        var NUM_CALLS = 2;
        function _process () {
          expect(successCallbacks[counter]).toHaveBeenCalledWith();
          counter++;
          (counter === NUM_CALLS) && done();
        }

        engineMock.reload({ success: successCallbacks[0] }).then(_process);
        engineMock.reload({ success: successCallbacks[1] }).then(_process);
      });

      it('should call errorCallback when the server returns an error response', function (done) {
        // Error server response
        spyOn($, 'ajax').and.callFake(function (params) { params.error(FAKE_ERROR_PAYLOAD); });
        // Attach the error callback to a spy.
        var errorCallback = jasmine.createSpy('errorCallback');

        engineMock.reload({ error: errorCallback }).catch(function () {
          var error = new WindshaftError({ message: 'Postgis Plugin: ERROR:  transform: couldnt project point (242 611 0): latitude or longitude exceeded limits.' });
          expect(errorCallback).toHaveBeenCalledWith(error);
          done();
        });
      });

      it('should call consecutive errorCallbacks when the server returns an error response', function (done) {
        // Error server response
        spyOn($, 'ajax').and.callFake(function (params) { params.error(FAKE_ERROR_PAYLOAD); });
        // Attach the error callbacks to a spy.
        var errorCallbacks = [
          jasmine.createSpy('errorCallback0'),
          jasmine.createSpy('errorCallback1')
        ];

        var counter = 0;
        var NUM_CALLS = 2;
        function _process () {
          var error = new WindshaftError({ message: 'Postgis Plugin: ERROR:  transform: couldnt project point (242 611 0): latitude or longitude exceeded limits.' });
          expect(errorCallbacks[counter]).toHaveBeenCalledWith(error);
          counter++;
          (counter === NUM_CALLS) && done();
        }

        engineMock.reload({ error: errorCallbacks[0] }).catch(_process);
        engineMock.reload({ error: errorCallbacks[1] }).catch(_process);
      });
    });

    describe('when using Events', function () {
      it('should trigger a RELOAD_STARTED event when the server returns a successful response', function (done) {
        // Successfull server response
        spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
        // Attach the started event handler to a spy.
        var spy = jasmine.createSpy('startedEventHandler');

        engineMock.on(Engine.Events.RELOAD_STARTED, spy);
        engineMock.reload().then(function () {
          expect(spy).toHaveBeenCalled();
          done();
        });
      });

      it('should trigger a RELOAD_SUCCESS event when the server returns a successful response', function (done) {
        // Successfull server response
        spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
        // Attach the success event handler to a spy.
        var spy = jasmine.createSpy('successEventHandler');

        engineMock.on(Engine.Events.RELOAD_STARTED, spy);
        engineMock.reload().then(function () {
          expect(spy).toHaveBeenCalled();
          done();
        });
      });

      it('should trigger a RELOAD_ERROR event when the server returns an error response', function (done) {
        // Error server response
        spyOn($, 'ajax').and.callFake(function (params) { params.error(FAKE_ERROR_PAYLOAD); });
        // Attach the error event handler to a spy.
        var spy = jasmine.createSpy('errorEventHandler');

        engineMock.on(Engine.Events.RELOAD_ERROR, spy);
        engineMock.reload().catch(function () {
          var error = new WindshaftError({ message: 'Postgis Plugin: ERROR:  transform: couldnt project point (242 611 0): latitude or longitude exceeded limits.' });
          expect(spy).toHaveBeenCalledWith(error);
          done();
        });
      });
    });

    it('should use the sourceID parameter', function (done) {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Spy on modelupdater to ensure thats called with fakesourceId
      var updateModelsSpy = spyOn(engineMock._modelUpdater, 'updateModels');

      engineMock.reload({
        sourceId: 'fakeSourceId'
      }).then(function () {
        expect(updateModelsSpy).toHaveBeenCalledWith(jasmine.anything(), 'fakeSourceId', undefined);
        done();
      });
    });

    it('should use the latest sourceID parameter', function (done) {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Spy on modelupdater to ensure thats called with fakesourceId
      var updateModelsSpy = spyOn(engineMock._modelUpdater, 'updateModels');

      engineMock.reload({
        sourceId: 'fakeSourceId'
      }).then(function () {
        expect(updateModelsSpy).toHaveBeenCalledWith(jasmine.anything(), 'fakeSourceId2', undefined);
        done();
      });
      engineMock.reload({
        sourceId: 'fakeSourceId2'
      });
    });

    it('should use true for the forceFetch parameter if it is true', function (done) {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Spy on modelupdater to ensure thats called with fakesourceId
      var updateModelsSpy = spyOn(engineMock._modelUpdater, 'updateModels');

      engineMock.reload({
        forceFetch: true
      }).then(function () {
        expect(updateModelsSpy).toHaveBeenCalledWith(jasmine.anything(), undefined, true);
        done();
      });
    });

    it('should use true for the forceFetch parameter if any is true', function (done) {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Spy on modelupdater to ensure thats called with fakesourceId
      var updateModelsSpy = spyOn(engineMock._modelUpdater, 'updateModels');

      engineMock.reload({
        forceFetch: false
      }).then(function () {
        expect(updateModelsSpy).toHaveBeenCalledWith(jasmine.anything(), undefined, true);
        done();
      });
      engineMock.reload({
        forceFetch: true
      });
      engineMock.reload({
        forceFetch: false
      });
    });

    it('should use false for the forceFetch parameter if it is false', function (done) {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Spy on modelupdater to ensure thats called with fakesourceId
      var updateModelsSpy = spyOn(engineMock._modelUpdater, 'updateModels');

      engineMock.reload({
        forceFetch: false
      }).then(function () {
        expect(updateModelsSpy).toHaveBeenCalledWith(jasmine.anything(), undefined, false);
        done();
      });
    });

    it('should use false for the forceFetch parameter if all are false', function (done) {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Spy on modelupdater to ensure thats called with fakesourceId
      var updateModelsSpy = spyOn(engineMock._modelUpdater, 'updateModels');

      engineMock.reload({
        forceFetch: false
      }).then(function () {
        expect(updateModelsSpy).toHaveBeenCalledWith(jasmine.anything(), undefined, false);
        done();
      });
      engineMock.reload({
        forceFetch: false
      });
      engineMock.reload({
        forceFetch: false
      });
    });

    it('should include the filters when the includeFilters option is true', function (done) {
      // Spy on instantiateMap to ensure thats called with fake_response
      spyOn(engineMock._windshaftClient, 'instantiateMap').and.callFake(function (request) { request.options.success(FAKE_RESPONSE); });
      // Add mock dataview
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var dataview = new Dataview({ id: 'dataview1', source: source }, { filter: new Backbone.Model(), map: {}, engine: engineMock });
      dataview.toJSON = jasmine.createSpy('toJSON').and.returnValue('fakeJson');
      engineMock.addDataview(dataview);

      engineMock.reload({
        includeFilters: true
      }).then(function () {
        expect(engineMock._windshaftClient.instantiateMap).toHaveBeenCalled();
        expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].options.includeFilters).toEqual(true);
        expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].params.filters.dataviews.dataviewId).toEqual('dataview1');
        done();
      });
    });

    it('should include the filters when the latest includeFilters option is true', function (done) {
      // Spy on instantiateMap to ensure thats called with fake_response
      spyOn(engineMock._windshaftClient, 'instantiateMap').and.callFake(function (request) { request.options.success(FAKE_RESPONSE); });

      engineMock.reload({
        includeFilters: false
      }).then(function () {
        expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].options.includeFilters).toEqual(true);
        done();
      });
      engineMock.reload({
        includeFilters: false
      });
      engineMock.reload({
        includeFilters: true
      });
    });

    it('should NOT include the filters when the includeFilters option is false', function (done) {
      // Spy on instantiateMap to ensure thats called with fake_response
      spyOn(engineMock._windshaftClient, 'instantiateMap').and.callFake(function (request) { request.options.success(FAKE_RESPONSE); });
      // Add mock dataview
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var dataview = new Dataview({ id: 'dataview1', source: source }, { filter: new Backbone.Model(), map: {}, engine: engineMock });
      dataview.toJSON = jasmine.createSpy('toJSON').and.returnValue('fakeJson');
      engineMock.addDataview(dataview);

      engineMock.reload({
        includeFilters: false
      }).then(function () {
        expect(engineMock._windshaftClient.instantiateMap).toHaveBeenCalled();
        expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].options.includeFilters).toEqual(false);
        expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].params.filters).toBeUndefined();
        done();
      });
    });

    it('should NOT include the filters when the latest includeFilters options is false', function (done) {
      // Spy on instantiateMap to ensure thats called with fake_response
      spyOn(engineMock._windshaftClient, 'instantiateMap').and.callFake(function (request) { request.options.success(FAKE_RESPONSE); });

      engineMock.reload({
        includeFilters: true
      }).then(function () {
        expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].options.includeFilters).toEqual(false);
        done();
      });
      engineMock.reload({
        includeFilters: true
      });
      engineMock.reload({
        includeFilters: false
      });
    });

    it('should update the layer metadata according to the server response', function (done) {
      // Successfull server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });

      engineMock.addLayer(layer);

      engineMock.reload().then(function () {
        var expectedLayerMetadata = { cartocss: '#layer {\nmarker-color: red;\n}', stats: { estimatedFeatureCount: 10031 }, cartocss_meta: { rules: [] } };
        var actualLayerMetadata = engineMock._layersCollection.at(0).attributes.meta;
        expect(actualLayerMetadata).toEqual(expectedLayerMetadata);
        done();
      });
    });

    it('should update the cartolayerGroup metadata according to the server response', function (done) {
      // Successfull server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });

      engineMock.addLayer(layer);

      engineMock.reload().then(function () {
        var urls = engineMock._cartoLayerGroup.attributes.urls;
        // Ensure the modelUpdater has updated the cartoLayerGroup urls
        expect(urls.attributes[0]).toEqual('http://3.ashbu.cartocdn.com/fake-username/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/0/attributes');
        expect(urls.grids[0]).toEqual(
          ['http://0.ashbu.cartocdn.com/fake-username/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/0/{z}/{x}/{y}.grid.json',
            'http://1.ashbu.cartocdn.com/fake-username/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/0/{z}/{x}/{y}.grid.json',
            'http://2.ashbu.cartocdn.com/fake-username/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/0/{z}/{x}/{y}.grid.json',
            'http://3.ashbu.cartocdn.com/fake-username/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/0/{z}/{x}/{y}.grid.json']);
        expect(urls.image).toEqual('http://{s}.ashbu.cartocdn.com/fake-username/api/v1/map/static/center/2edba0a73a790c4afb83222183782123:1508164637676/{z}/{lat}/{lng}/{width}/{height}.{format}');
        expect(urls.tiles).toEqual('http://{s}.ashbu.cartocdn.com/fake-username/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/{layerIndexes}/{z}/{x}/{y}.{format}');
        done();
      });
    });
  });

  describe('CartoLayerGroup bindings', function () {
    it('should trigger a windshaft error from CartoLayerGroup error', function () {
      var spy = jasmine.createSpy('spy');
      engineMock.on(Engine.Events.LAYER_ERROR, spy);

      engineMock._cartoLayerGroup.trigger('error:layer', 'an error');

      expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
        origin: 'windshaft',
        _error: 'an error'
      }));
    });
  });

  describe('.getApiKey', function () {
    it('should return the internal API key', function () {
      var apiKey = 'qwud2iu2';
      var anotherEngine = createEngine({
        apiKey: apiKey
      });

      var returnedKey = anotherEngine.getApiKey();

      expect(returnedKey).toBe(apiKey);
    });
  });

  describe('.getAuthToken', function () {
    it('should return the internal auth token', function () {
      var authToken = ['covfefe', 'location'];
      var anotherEngine = createEngine({
        apiKey: null,
        authToken: authToken
      });

      var returnedAuthToken = anotherEngine.getAuthToken();

      expect(returnedAuthToken).toBe(authToken);
    });
  });
});
