var $ = require('jquery');
var _ = require('underscore');
var Engine = require('../../src/engine');
var MockFactory = require('../helpers/mockFactory');
var FAKE_RESPONSE = require('./windshaft/response.mock');
var CartoDBLayer = require('../../src/geo/map/cartodb-layer');
var Dataview = require('../../src/dataviews/dataview-model-base');
var Backbone = require('backbone');

describe('Engine', function () {
  var engineMock;

  beforeEach(function () {
    engineMock = MockFactory.createEngine();
  });

  describe('Constructor', function () {
    it('should throw a descriptive error when called with no parameters', function () {
      expect(function () {
        new Engine(); // eslint-disable-line
      }).toThrowError('new Engine() called with no paramters');
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
    it('should add a new layer', function () {
      var style = '#layer { marker-color: red; }';
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var layer = new CartoDBLayer({ source: source, style: style }, { engine: engineMock });
      expect(engineMock._layersCollection.length).toEqual(0);
      engineMock.addLayer(layer);
      expect(engineMock._layersCollection.length).toEqual(1);
      expect(engineMock._layersCollection.at(0)).toEqual(layer);
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

  describe('.reload', function () {
    var layer;

    beforeEach(function () {
      var style = '#layer { marker-color: red; }';
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      layer = new CartoDBLayer({ source: source, style: style }, { engine: engineMock });
    });

    it('should perform a request with the state encoded in a payload (no layers, no dataviews) ', function (done) {
      spyOn($, 'ajax').and.callFake(function (params) {
        var actual = params.url;
        var expected = 'http://example.com/api/v1/map?config=%7B%22buffersize%22%3A%7B%22mvt%22%3A0%7D%2C%22layers%22%3A%5B%5D%2C%22dataviews%22%3A%7B%7D%2C%22analyses%22%3A%5B%5D%7D&stat_tag=fake-stat-tag&api_key=fake-api-key';
        expect(actual).toEqual(expected);
        done();
      });
      engineMock.reload();
    });

    it('should perform a request with the state encoded in a payload (single layer) ', function (done) {
      spyOn($, 'ajax').and.callFake(function (params) {
        var actual = params.url;
        var expected = 'http://example.com/api/v1/map?config=%7B%22buffersize%22%3A%7B%22mvt%22%3A0%7D%2C%22layers%22%3A%5B%7B%22type%22%3A%22mapnik%22%2C%22options%22%3A%7B%22cartocss_version%22%3A%222.1.0%22%2C%22source%22%3A%7B%22id%22%3A%22a1%22%7D%2C%22interactivity%22%3A%5B%22cartodb_id%22%5D%7D%7D%5D%2C%22dataviews%22%3A%7B%7D%2C%22analyses%22%3A%5B%7B%22id%22%3A%22a1%22%2C%22type%22%3A%22source%22%2C%22params%22%3A%7B%22query%22%3A%22SELECT%20*%20FROM%20table%22%7D%7D%5D%7D&stat_tag=fake-stat-tag&api_key=fake-api-key';
        expect(actual).toEqual(expected);
        done();
      });

      engineMock.addLayer(layer);
      engineMock.reload();
    });

    it('should trigger a RELOAD_SUCCESS event when the server returns a successful response ', function () {
      // Successfull server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Fake model updater.
      spyOn(engineMock._modelUpdater, 'updateModels').and.callFake(function () { });
      // Attach the success event to a spy.
      var spy = jasmine.createSpy('successCallback');

      engineMock.on(Engine.Events.RELOAD_SUCCESS, spy);
      engineMock.reload();
      expect(spy).toHaveBeenCalled();
    });

    it('should trigger a RELOAD_ERROR event when the server returns an error response ', function () {
      // Error server response
      var errorMessage = 'Postgis Plugin: ERROR:  transform: couldnt project point (242 611 0): latitude or longitude exceeded limits.';
      var errorPayload = {
        responseText: '{ "errors": ["' + errorMessage + '"]}'
      };
      spyOn($, 'ajax').and.callFake(function (params) {
        params.error(errorPayload);
      });
      spyOn(engineMock._modelUpdater, 'setErrors').and.callThrough();
      // Attach the error event to a spy.
      var spy = jasmine.createSpy('errorCallback');
      engineMock.on(Engine.Events.RELOAD_ERROR, spy);

      engineMock.reload();

      expect(spy).toHaveBeenCalled();
      var setErrorsArgs = engineMock._modelUpdater.setErrors.calls.mostRecent().args[0];
      expect(setErrorsArgs).toBeDefined();
      expect(_.isArray(setErrorsArgs)).toBe(true);
      expect(setErrorsArgs[0].message).toEqual(errorMessage);
    });

    it('should use the sourceID parameter', function (done) {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Spy on modelupdater to ensure thats called with fakesourceId
      var updateModelsSpy = spyOn(engineMock._modelUpdater, 'updateModels');

      // When the reload is finished, check the spy.
      engineMock.on(Engine.Events.RELOAD_SUCCESS, function () {
        expect(updateModelsSpy).toHaveBeenCalledWith(jasmine.anything(), 'fakeSourceId', undefined);
        done();
      });
      engineMock.reload('fakeSourceId');
    });

    it('should use the forceFetch parameter', function (done) {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Spy on modelupdater to ensure thats called with fakesourceId
      var updateModelsSpy = spyOn(engineMock._modelUpdater, 'updateModels');

      // When the reload is finished, check the spy.
      engineMock.on(Engine.Events.RELOAD_SUCCESS, function () {
        expect(updateModelsSpy).toHaveBeenCalledWith(jasmine.anything(), 'fakeSourceId', true);
        done();
      });

      engineMock.reload('fakeSourceId', true);
    });

    // The following tests overlaps the model-updater tests.

    it('should update the layer metadata according to the server response', function (done) {
      // Successfull server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });

      engineMock.addLayer(layer);
      engineMock.on(Engine.Events.RELOAD_SUCCESS, function () {
        var expectedLayerMetadata = { cartocss: '#layer {\nmarker-color: red;\n}', stats: { estimatedFeatureCount: 10031 }, cartocss_meta: { rules: [] } };
        var actualLayerMetadata = engineMock._layersCollection.at(0).attributes.meta;
        expect(actualLayerMetadata).toEqual(expectedLayerMetadata);
        done();
      });

      engineMock.reload();
    });

    it('should update the cartolayerGroup metadata according to the server response', function (done) {
      // Successfull server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });

      engineMock.addLayer(layer);
      engineMock.on(Engine.Events.RELOAD_SUCCESS, function () {
        var urls = engineMock._cartoLayerGroup.attributes.urls;
        // Ensure the modelUpdater has updated the cartoLayerGroup urls
        expect(urls.attributes[0]).toEqual('http://example.com/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/0/attributes');
        expect(urls.grids[0]).toEqual(['http://example.com/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/0/{z}/{x}/{y}.grid.json']);
        expect(urls.image).toEqual('http://example.com/api/v1/map/static/center/2edba0a73a790c4afb83222183782123:1508164637676/{z}/{lat}/{lng}/{width}/{height}.{format}');
        expect(urls.tiles).toEqual('http://example.com/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/{layerIndexes}/{z}/{x}/{y}.{format}');
        done();
      });

      engineMock.reload();
    });

    it('should update the analyses metadata according to the server response', function (done) {
      pending('Test not implemented');
    });

    it('should update the dataview metadata according to the server response', function (done) {
      pending('Test not implemented');
    });

    it('should include the filters when the includeFilters option is true', function () {
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var dataview = new Dataview({ id: 'dataview1', source: source }, { filter: new Backbone.Model(), map: {}, engine: engineMock });
      dataview.toJSON = jasmine.createSpy('toJSON').and.returnValue('fakeJson');
      engineMock.addDataview(dataview);
      spyOn(engineMock._windshaftClient, 'instantiateMap');

      engineMock.reload('fakeSourceId', false, true);

      expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].options.includeFilters).toEqual(true);
      expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].params.filters.dataviews.dataviewId).toEqual('dataview1');
    });

    it('should NOT include the filters when the includeFilters option is false', function () {
      var source = MockFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var dataview = new Dataview({ id: 'dataview1', source: source }, { filter: new Backbone.Model(), map: {}, engine: engineMock });
      dataview.toJSON = jasmine.createSpy('toJSON').and.returnValue('fakeJson');
      engineMock.addDataview(dataview);
      spyOn(engineMock._windshaftClient, 'instantiateMap');

      engineMock.reload('fakeSourceId', false, false);

      expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].options.includeFilters).toEqual(false);
      expect(engineMock._windshaftClient.instantiateMap.calls.mostRecent().args[0].params.filters).toBeUndefined();
    });
  });
});
