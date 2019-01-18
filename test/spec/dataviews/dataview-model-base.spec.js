var _ = require('underscore');
var Backbone = require('backbone');
var VisModel = require('../../../src/vis/vis');
var MapModel = require('../../../src/geo/map');
var DataviewModelBase = require('../../../src/dataviews/dataview-model-base');
var WindshaftFiltersBoundingBox = require('../../../src/windshaft/filters/bounding-box');
var AnalysisService = require('../../../src/analysis/analysis-service');
var MapModelBoundingBoxAdapter = require('../../../src/geo/adapters/map-model-bounding-box-adapter');
var MockFactory = require('../../helpers/mockFactory');
var createEngine = require('../fixtures/engine.fixture.js');

var fakeCamshaftReference = {
  getSourceNamesForAnalysisType: function (analysisType) {
    var map = {
      'source': [],
      'trade-area': ['source'],
      'estimated-population': ['source'],
      'point-in-polygon': ['points_source', 'polygons_source'],
      'union': ['source']
    };
    if (!map[analysisType]) {
      throw new Error('analysis type ' + analysisType + ' not supported');
    }
    return map[analysisType];
  },

  getParamNamesForAnalysisType: function (analysisType) {
    var map = {
      'source': ['query'],
      'trade-area': ['kind', 'time'],
      'estimated-population': ['columnName'],
      'point-in-polygon': [],
      'union': ['join_on']
    };
    if (!map[analysisType]) {
      throw new Error('analysis type ' + analysisType + ' not supported');
    }
    return map[analysisType];
  }
};

describe('dataviews/dataview-model-base', function () {
  var engineMock;
  var apiKeyQueryParam;

  beforeEach(function () {
    this.map = new MapModel(null, {
      layersFactory: {}
    });
    this.map.setBounds([[102, 200], [300, 400]]);

    this.vis = new VisModel();
    engineMock = createEngine();
    this.vis._layersCollection = engineMock._layersCollection;
    this.vis._dataviewsCollection = engineMock._dataviewsCollection;
    apiKeyQueryParam = 'api_key=' + engineMock.getApiKey();

    this.vis._onMapInstantiatedForTheFirstTime();

    this.analysisService = new AnalysisService({
      engine: engineMock,
      camshaftReference: fakeCamshaftReference
    });
    this.source = this.analysisService.analyse({
      id: 'a0',
      type: 'source'
    });
    this.analysisNodes = this.source.getNodesCollection();

    // Disable debounce
    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.model = new DataviewModelBase({
      source: this.source
    }, {
      engine: engineMock,
      bboxFilter: new WindshaftFiltersBoundingBox(new MapModelBoundingBoxAdapter(this.map))
    });
    this.model.toJSON = jasmine.createSpy('toJSON').and.returnValue({});
    engineMock._dataviewsCollection.add(this.model);

    this.model._bboxFilter._stopBinds();
    this.model._bboxFilter._initBinds();
  });

  describe('url', function () {
    it('should include the bbox param', function () {
      this.map.setBounds([['south', 'west'], ['north', 'east']]);

      this.model.set('url', 'http://example.com');

      expect(this.model.url()).toEqual('http://example.com?bbox=west,south,east,north&' + apiKeyQueryParam);
    });

    it('should allow subclasses to define specific URL params', function () {
      this.map.setBounds([['south', 'west'], ['north', 'east']]);

      this.model.set('url', 'http://example.com');

      spyOn(this.model, '_getDataviewSpecificURLParams').and.returnValue([ 'a=b', 'c=d' ]);

      expect(this.model.url()).toEqual('http://example.com?bbox=west,south,east,north&a=b&c=d&' + apiKeyQueryParam);
    });

    it('should append an api_key param if apiKey attr is present (and not use the auth_token)', function () {
      this.map.setBounds([['south', 'west'], ['north', 'east']]);

      this.model.set({
        url: 'http://example.com',
        apiKey: 'THE_API_KEY',
        authToken: 'THE_AUTH_TOKEN'
      });

      spyOn(this.model, '_getDataviewSpecificURLParams').and.returnValue([ 'a=b', 'c=d' ]);

      expect(this.model.url()).toEqual('http://example.com?bbox=west,south,east,north&a=b&c=d&' + apiKeyQueryParam);
    });

    it('should append an auth_token param if authToken is present', function () {
      this.map.setBounds([['south', 'west'], ['north', 'east']]);
      this.model.set({ url: 'http://example.com' });
      delete this.model._engine._windshaftSettings.apiKey;

      spyOn(this.model, '_getDataviewSpecificURLParams').and.returnValue([ 'a=b', 'c=d' ]);

      expect(this.model.url()).toEqual('http://example.com?bbox=west,south,east,north&a=b&c=d&auth_token[]=fabada&auth_token[]=coffee');
    });
  });

  describe('when url changes', function () {
    beforeEach(function () {
      spyOn(this.model, 'fetch');
      spyOn(this.model, 'listenTo');
      spyOn(this.model, 'on');
    });

    describe('when map view bounds are ready', function () {
      beforeEach(function () {
        this.model.set('url', 'http://example.com');
      });

      it('should fetch', function () {
        expect(this.model.fetch).toHaveBeenCalled();
      });

      describe('when fetch succeeds', function () {
        beforeEach(function () {
          this.model.fetch.calls.argsFor(0)[0].success();
        });

        it('should change bounds', function () {
          expect(this.model.on.calls.argsFor(0)[0]).toEqual('change:sync_on_bbox_change');
          expect(this.model.on.calls.argsFor(1)[0]).toEqual('change:url');
          expect(this.model.on.calls.argsFor(2)[0]).toEqual('change:enabled');
        });
      });
    });

    describe('when map view bounds are NOT ready', function () {
      beforeEach(function () {
        spyOn(this.model._bboxFilter, 'areBoundsAvailable').and.returnValue(false);
      });

      describe('when sync_on_bbox_change is true', function () {
        beforeEach(function () {
          this.model.set({
            'sync_on_bbox_change': true,
            'url': 'http://example.com'
          });
        });

        it('should wait until view bounds are ready', function () {
          expect(this.model.fetch).not.toHaveBeenCalled();

          this.map.setBounds([[5, 6], [7, 8]]);

          expect(this.model.fetch).toHaveBeenCalled();
        });
      });

      describe('when sync_on_bbox_change is false', function () {
        beforeEach(function () {
          this.model.set({
            'sync_on_bbox_change': false,
            'url': 'http://example.com'
          });
        });

        it('should fetch', function () {
          expect(this.model.fetch).toHaveBeenCalled();
        });
      });
    });
  });

  describe('after first successful fetch', function () {
    beforeEach(function () {
      this.model.fetch = function (opts) {
        opts.success();
      };
      this.model.set('url', 'newurl');
    });

    it('should not fetch new data when url changes and dataview is disabled', function () {
      this.model.set('enabled', false);
      spyOn(this.model, 'fetch');
      this.model.trigger('change:url', this.model);
      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should fetch if url changes and forceFetch option is true, no matter rest of variables', function () {
      this.model.set('enabled', false);
      spyOn(this.model, 'fetch');

      this.model.trigger('change:url', this.model, {}, { forceFetch: true });

      expect(this.model.fetch).toHaveBeenCalled();

      this.model.fetch.calls.reset();

      this.model.trigger('change:url', this.model, {}, { forceFetch: false });

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should fetch if url changes and sourceId is not defined', function () {
      spyOn(this.model, 'fetch');

      this.model.set('url', 'http://somethingelese.com');

      expect(this.model.fetch).toHaveBeenCalled();
    });

    describe('when change:url has a sourceId option', function () {
      beforeEach(function () {
        var analysisA = this.analysisService.analyse({
          id: 'a2',
          type: 'estimated-population',
          params: {
            columnName: 'estimated_people',
            source: {
              id: 'a1',
              type: 'trade-area',
              params: {
                kind: 'walk',
                time: 300,
                source: {
                  id: 'a0',
                  type: 'source',
                  params: {
                    query: 'select * from subway_stops'
                  }
                }
              }
            }
          }
        });
        var analysisNodes = analysisA.getNodesCollection();

        this.model.set('source', analysisNodes.get('a1'), { silent: true });

        spyOn(this.model, 'fetch');
      });

      it("should fetch if sourceId matches the dataview's source", function () {
        this.model.set('url', 'http://somethingelese.com', {
          sourceId: 'a1'
        });

        expect(this.model.fetch).toHaveBeenCalled();
      });

      it("should fetch if sourceId is a node that affects the dataview's source", function () {
        this.model.set('url', 'http://somethingelese.com', {
          sourceId: 'a0'
        });

        expect(this.model.fetch).toHaveBeenCalled();
      });

      it("should NOT fetch if sourceId is a node that doesn't affect the dataview's source", function () {
        this.model.set('url', 'http://somethingelese.com', {
          sourceId: 'a2'
        });

        expect(this.model.fetch).not.toHaveBeenCalled();
      });
    });
  });

  describe('when enabled is changed to true from false', function () {
    beforeEach(function () {
      this.model.fetch = function (opts) {
        opts.success();
      };
      this.model.set('url', 'http://example.com');

      this.model.set('enabled', false);

      spyOn(this.model, 'fetch');
    });

    it('should NOT fetch if nothing has changed', function () {
      this.model.set('enabled', true);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should fetch if the bounding box have changed while the dataview was disabled', function () {
      // Map bounds have changed
      this.map.setBounds([[102, 200], [300, 400]]);
      this.map.trigger('change:center');

      this.model.set('enabled', true);

      expect(this.model.fetch).toHaveBeenCalled();

      this.model.fetch.calls.reset();

      // Disable and enable again
      this.model.set('enabled', false);
      this.model.set('enabled', true);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should NOT fetch if the bounding box have changed while the dataview was disabled and sync_on_bbox_change is disabled', function () {
      this.model.set('sync_on_bbox_change', false);
      // To get the full range of data
      expect(this.model.fetch).toHaveBeenCalled();
      this.model.fetch.calls.reset();

      // Map bounds have changed
      this.map.setBounds([[102, 200], [300, 400]]);
      this.map.trigger('change:center');

      this.model.set('enabled', true);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should fetch if URL has changed while the dataview was disabled', function () {
      this.model.set('url', 'http://somethingelse.com');

      this.model.set('enabled', true);

      expect(this.model.fetch).toHaveBeenCalled();

      this.model.fetch.calls.reset();

      // Disable and enable again
      this.model.set('enabled', false);
      this.model.set('enabled', true);

      expect(this.model.fetch).not.toHaveBeenCalled();
    });
  });

  describe('bindings to map bounds', function () {
    beforeEach(function () {
      this.model.fetch = function (opts) {
        opts.success();
      };
      this.model.set('url', 'http://example.com');

      spyOn(this.model, 'fetch');
    });

    it('should fetch when the bounding box has changed', function () {
      this.map.setBounds([[102, 200], [300, 400]]);
      this.map.trigger('change:center');

      expect(this.model.fetch).toHaveBeenCalled();
    });

    it('should NOT fetch when the bounding box has changed and the dataview is not enabled', function () {
      this.model.set('enabled', false);

      this.map.setBounds([[102, 200], [300, 400]]);
      this.map.trigger('change:center');

      expect(this.model.fetch).not.toHaveBeenCalled();
    });

    it('should NOT fetch when the bounding box has changed and the dataview has sync_on_bbox_change disabled', function () {
      this.model.set('sync_on_bbox_change', false);
      // To get the full range of data
      expect(this.model.fetch).toHaveBeenCalled();
      this.model.fetch.calls.reset();

      this.map.setBounds([[102, 200], [300, 400]]);
      this.map.trigger('change:center');

      expect(this.model.fetch).not.toHaveBeenCalled();
    });
  });

  describe('bindings to the filter', function () {
    it('should reload the map by default when the filter changes', function () {
      var filter = new Backbone.Model();
      new DataviewModelBase({ // eslint-disable-line
        source: this.source
      }, {
        map: this.map,
        engine: engineMock,
        filter: filter
      });

      // Filter changes
      filter.trigger('change', filter);

      expect(engineMock.reload).toHaveBeenCalledWith({ sourceId: 'a0' });
    });
  });

  describe('.remove', function () {
    beforeEach(function () {
      this.removeSpy = jasmine.createSpy('remove');
      this.model.once('destroy', this.removeSpy);
      spyOn(this.model, 'stopListening');
      spyOn(this.source, 'off').and.callThrough();

      this.model.filter = jasmine.createSpyObj('filter', ['remove', 'isEmpty']);
      this.model.filter.isEmpty.and.returnValue(false);

      this.model.remove();
    });

    it('should trigger a destroy event', function () {
      expect(this.removeSpy).toHaveBeenCalledWith(this.model);
    });

    it('should stop listening to events', function () {
      expect(this.model.stopListening).toHaveBeenCalled();
      expect(this.source.off).toHaveBeenCalledWith('change:status', jasmine.any(Function), this.model);
    });
  });

  describe('.update', function () {
    it('should only update the attrs set on ATTRS_NAMES', function () {
      this.model.update({ foo: 'bar' });
      expect(this.model.changedAttributes()).toBe(false);

      expect(this.model.get('sync_on_bbox_change')).toBe(true);
      this.model.update({
        sync_on_bbox_change: false,
        foo: 'bar'
      });
      expect(this.model.changedAttributes()).toEqual({
        sync_on_bbox_change: false
      });
    });
  });

  describe('.fetch', function () {
    it('should trigger a loading event', function () {
      spyOn(this.model, 'trigger');

      this.model.fetch();

      expect(this.model.trigger).toHaveBeenCalledWith('loading', this.model);
    });
  });

  describe('getSourceType', function () {
    it('should return the type of the source', function () {
      var dataview = new DataviewModelBase({
        source: this.analysisNodes.get('a0')
      }, {
        map: this.map,
        engine: engineMock
      });

      expect(dataview.getSourceType()).toEqual('source');
    });
  });

  describe('isSourceType', function () {
    it('should return true if the source type is source', function () {
      var dataview = new DataviewModelBase({
        source: this.analysisNodes.get('a0')
      }, {
        map: this.map,
        engine: engineMock
      });
      dataview.getSourceType = function () {
        return 'source';
      };

      expect(dataview.isSourceType()).toBe(true);
    });
  });

  describe('when source type is not source', function () {
    describe('isSourceType', function () {
      it('should return false', function () {
        var dataview = new DataviewModelBase({
          source: this.analysisNodes.get('a0')
        }, {
          map: this.map,
          engine: engineMock
        });
        dataview.getSourceType = function () {
          return 'sampling';
        };

        expect(dataview.isSourceType()).toBe(false);
      });
    });
  });

  describe('getSourceId', function () {
    it('should return the id of the source', function () {
      var dataview = new DataviewModelBase({
        source: this.source
      }, { // eslint-disable-line
        map: this.map,
        engine: engineMock
      });

      expect(dataview.getSourceId()).toEqual('a0');
    });
  });

  describe('when analysis changes status', function () {
    beforeEach(function () {
      this.source.isLoading = jasmine.createSpy('a0.isLoading');
      this.source.isFailed = jasmine.createSpy('a0.isFailed');
      this.model.on({
        loading: this.loadingSpy = jasmine.createSpy('loading'),
        statusError: this.errorSpy = jasmine.createSpy('failed')
      });
    });

    sharedTestsForAnalysisEvents();

    describe('when changed source', function () {
      beforeEach(function () {
        this.model.set('source', this.source);
      });

      sharedTestsForAnalysisEvents();
    });
  });

  describe('source references', function () {
    var source;
    var dataview;

    beforeEach(function () {
      source = MockFactory.createAnalysisModel({ id: 'a0' });

      dataview = new DataviewModelBase({
        source: source
      }, {
        map: this.map,
        engine: engineMock
      });
    });

    describe('when dataview is initialized', function () {
      it('should mark source as referenced', function () {
        expect(source.isSourceOf(dataview)).toBe(true);
      });
    });

    describe('when dataview is removed', function () {
      it('should unmark source as referenced', function () {
        expect(source.isSourceOf(dataview)).toBe(true);

        dataview.remove();

        expect(source.isSourceOf(dataview)).toBe(false);
      });
    });
  });

  describe('._parseError', function () {
    var source;
    var dataview;

    beforeEach(function () {
      source = MockFactory.createAnalysisModel({ id: 'a0' });

      dataview = new DataviewModelBase({
        source: source
      }, {
        map: this.map,
        engine: engineMock
      });
    });

    it('should pass the response directly to the parser and get the first returned error', function () {
      var response = {
        responseJSON: {
          errors: ['an error']
        }
      };

      var error = dataview._parseError(response);

      expect(error.message).toEqual('an error');
    });
  });

  describe('._fetch', function () {
    describe('when request is success', function () {
      beforeEach(function () {
        this.model.fetch = function (opts) {
          opts.success();
        };
      });

      it('sets _hasBinds to true', function () {
        expect(this.model._hasBinds).toBe(false);

        this.model._fetch();

        expect(this.model._hasBinds).toBe(true);
      });

      it('calls ._onChangeBinds', function () {
        spyOn(this.model, '_onChangeBinds');

        this.model._fetch();

        expect(this.model._onChangeBinds).toHaveBeenCalled();
      });
    });
  });

  describe('._onMapBoundsChanged', function () {
    describe('when _shouldFetchOnBoundingBoxChange is true', function () {
      it('calls ._fetch', function () {
        spyOn(this.model, '_shouldFetchOnBoundingBoxChange').and.returnValue(true);
        spyOn(this.model, '_fetch');

        this.model._onMapBoundsChanged();

        expect(this.model._fetch).toHaveBeenCalled();
      });
    });
  });
});

function sharedTestsForAnalysisEvents () {
  describe('should trigger the event according to state', function () {
    it('should trigger loading event', function () {
      this.loadingSpy.calls.reset();
      this.errorSpy.calls.reset();
      this.source.isLoading.and.returnValue(true);

      this.source.set('status', 'whatever');
      expect(this.loadingSpy).toHaveBeenCalled();
      expect(this.errorSpy).not.toHaveBeenCalled();

      this.loadingSpy.calls.reset();
      this.errorSpy.calls.reset();
      this.source.isLoading.and.returnValue(false);
      this.source.isFailed.and.returnValue(true);

      this.source.set({
        status: 'failed',
        error: this.err = {}
      });
      expect(this.loadingSpy).not.toHaveBeenCalled();
      expect(this.errorSpy).toHaveBeenCalledWith(this.model, this.err);
    });
  });
}
