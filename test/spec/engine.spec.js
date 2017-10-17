var $ = require('jquery');
var Backbone = require('backbone');
var Engine = require('../../src/engine');
var FakeFactory = require('../helpers/fakeFactory');
var FAKE_RESPONSE = require('./windshaft/response.mock');
var CartoDBLayer = require('../../src/geo/map/cartodb-layer');

describe('Engine', function () {
  var fakeVis = new Backbone.Model();
  describe('Constructor', function () {
    it('Should throw a descriptive error when called with no parameters', function () {
      expect(function () {
        new Engine(); // eslint-disable-line
      }).toThrowError('new Engine() called with no paramters');
    });
  });

  describe('events', function () {
    var engine;
    var spy;
    beforeEach(function () {
      engine = new Engine({ serverUrl: 'http://example.com', username: 'fake-username' });
      spy = jasmine.createSpy('spy');
    });
    describe('on', function () {
      it('Should register a callback thats called for "fake-event"', function () {
        engine.on('fake-event', spy);
        expect(spy).not.toHaveBeenCalled(); // Ensure the spy not has been called previosuly
        engine._eventEmmitter.trigger('fake-event');
        expect(spy).toHaveBeenCalled();
      });
    });
    describe('off', function () {
      it('Should unregister a callback', function () {
        engine.on('fake-event', spy);
        expect(spy).not.toHaveBeenCalled(); // Ensure the spy not has been called previosuly
        engine._eventEmmitter.trigger('fake-event');
        expect(spy).toHaveBeenCalled();
        engine.off('fake-event', spy);
        engine._eventEmmitter.trigger('fake-event');
        expect(spy.calls.count()).toBe(1);
      });
    });
  });

  describe('.addLayer', function () {
    it('Should add a new layer', function () {
      var engine = new Engine({ serverUrl: 'http://example.com', username: 'fake-username' });
      var style = '#layer { marker-color: red; }';
      var source = FakeFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      var layer = new CartoDBLayer({ source: source, style: style }, { vis: fakeVis });
      expect(engine._layersCollection.length).toEqual(0);
      engine.addLayer(layer);
      expect(engine._layersCollection.length).toEqual(1);
      expect(engine._layersCollection.at(0)).toEqual(layer);
    });
  });

  describe('.reload', function () {
    var layer;
    var engine;
    var fakeVis = new Backbone.Model();

    beforeEach(function () {
      engine = new Engine({ serverUrl: 'http://example.com', username: 'fake-username' });
      var style = '#layer { marker-color: red; }';
      var source = FakeFactory.createAnalysisModel({ id: 'a1', type: 'source', query: 'SELECT * FROM table' });
      layer = new CartoDBLayer({ source: source, style: style }, { vis: fakeVis });
    });

    it('Should perform a request with the state encoded in a payload (no layers, no dataviews) ', function (done) {
      spyOn($, 'ajax').and.callFake(function (params) {
        var actual = params.url;
        var expected = 'http://example.com/api/v1/map?config=%7B%22buffersize%22%3A%7B%22mvt%22%3A0%7D%2C%22layers%22%3A%5B%5D%2C%22dataviews%22%3A%7B%7D%2C%22analyses%22%3A%5B%5D%7D';
        expect(actual).toEqual(expected);
        done();
      });
      engine.reload();
    });

    it('Should perform a request with the state encoded in a payload (single layer) ', function (done) {
      spyOn($, 'ajax').and.callFake(function (params) {
        var actual = params.url;
        var expected = 'http://example.com/api/v1/map?config=%7B%22buffersize%22%3A%7B%22mvt%22%3A0%7D%2C%22layers%22%3A%5B%7B%22type%22%3A%22mapnik%22%2C%22options%22%3A%7B%22cartocss_version%22%3A%222.1.0%22%2C%22source%22%3A%7B%22id%22%3A%22a1%22%7D%2C%22interactivity%22%3A%5B%22cartodb_id%22%5D%7D%7D%5D%2C%22dataviews%22%3A%7B%7D%2C%22analyses%22%3A%5B%7B%22id%22%3A%22a1%22%2C%22type%22%3A%22source%22%2C%22params%22%3A%7B%22query%22%3A%22SELECT%20*%20FROM%20table%22%7D%7D%5D%7D';
        expect(actual).toEqual(expected);
        done();
      });

      engine.addLayer(layer);
      engine.reload();
    });

    it('Should trigger a RELOAD_SUCCESS event when the server returns a successful response ', function () {
      // Successfull server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Fake model updater.
      spyOn(engine._modelUpdater, 'updateModels').and.callFake(function () { });
      // Attach the success event to a spy.
      var spy = jasmine.createSpy('successCallback');

      engine.on(Engine.Events.RELOAD_SUCCESS, spy);
      engine.reload();
      expect(spy).toHaveBeenCalled();
    });

    it('Should trigger a RELOAD_ERROR event when the server returns an error response ', function () {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.error({}); });
      // Fake model updater.
      spyOn(engine._modelUpdater, 'setErrors').and.callFake(function () { });
      // Attach the error event to a spy.
      var spy = jasmine.createSpy('errorCallback');

      engine.on(Engine.Events.RELOAD_ERROR, spy);
      engine.reload();
      expect(spy).toHaveBeenCalled();
    });

    it('Should use the sourceID parameter', function () {
      // Error server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });
      // Spy on modelupdater to ensure thats called with fakesourceId
      var spy = spyOn(engine._modelUpdater, 'updateModels');
      // Attach the error event to a spy.
      engine.on(Engine.Events.RELOAD_SUCCESS, spy);

      engine.reload('fakeSourceId');
      expect(spy).toHaveBeenCalledWith(jasmine.anything(), 'fakeSourceId', undefined);
    });

    // The following tests overlaps the model-updater tests.

    it('Should update the layer metadata according to the server response', function (done) {
      // Successfull server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });

      engine.addLayer(layer);
      engine.on(Engine.Events.RELOAD_SUCCESS, function () {
        var expectedLayerMetadata = { cartocss: '#layer {\nmarker-color: red;\n}', stats: { estimatedFeatureCount: 10031 }, cartocss_meta: { rules: [] } };
        var actualLayerMetadata = engine._layersCollection.at(0).attributes.meta;
        expect(actualLayerMetadata).toEqual(expectedLayerMetadata);
        done();
      });

      engine.reload();
    });

    fit('Should update the cartolayerGroup metadata according to the server response', function (done) {
      // Successfull server response
      spyOn($, 'ajax').and.callFake(function (params) { params.success(FAKE_RESPONSE); });

      engine.addLayer(layer);
      engine.on(Engine.Events.RELOAD_SUCCESS, function () {
        var urls = engine._layerGroupModel.attributes.urls;
        // Ensure the modelUpdater has updated the cartoLayerGroup urls
        expect(urls.attributes[0]).toEqual('http://example.com/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/0/attributes');
        expect(urls.grids[0]).toEqual(['http://example.com/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/0/{z}/{x}/{y}.grid.json']);
        expect(urls.image).toEqual('http://example.com/api/v1/map/static/center/2edba0a73a790c4afb83222183782123:1508164637676/{z}/{lat}/{lng}/{width}/{height}.{format}');
        expect(urls.tiles).toEqual('http://example.com/api/v1/map/2edba0a73a790c4afb83222183782123:1508164637676/{layerIndexes}/{z}/{x}/{y}.{format}');
        done();
      });

      engine.reload();
    });

    it('Should update the analyses metadata according to the server response', function (done) {
      pending('Test not implemented');
    });

    it('Should update the dataview metadata according to the server response', function (done) {
      pending('Test not implemented');
    });
  });
});
