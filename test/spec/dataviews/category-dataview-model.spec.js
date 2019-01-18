var Backbone = require('backbone');
var _ = require('underscore');
var CategoryDataviewModel = require('../../../src/dataviews/category-dataview-model');
var WindshaftFiltersCategory = require('../../../src/windshaft/filters/category');
var WindshaftFiltersBoundingBox = require('../../../src/windshaft/filters/bounding-box');
var AnalysisService = require('../../../src/analysis/analysis-service');
var MapModelBoundingBoxAdapter = require('../../../src/geo/adapters/map-model-bounding-box-adapter');
var createEngine = require('../fixtures/engine.fixture.js');

describe('dataviews/category-dataview-model', function () {
  var engineMock;
  var apiKey = 'API_KEY';
  var apiKeyQueryParam = 'api_key=' + apiKey;

  beforeEach(function () {
    this.map = new Backbone.Model();
    this.map.getViewBounds = jasmine.createSpy();
    engineMock = createEngine({ apiKey: apiKey });
    this.map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    var analysisDefinition = {
      id: 'a0',
      type: 'source',
      params: {
        query: 'SELECT * FROM blairbnb_listings'
      }
    };

    var analysisService = new AnalysisService({ engine: engineMock });
    this.source = analysisService.analyse(analysisDefinition);

    spyOn(_, 'debounce').and.callFake(function (func) { return function () { func.apply(this, arguments); }; });

    this.model = new CategoryDataviewModel({
      source: this.source
    }, {
      engine: engineMock,
      filter: new WindshaftFiltersCategory(),
      bboxFilter: new WindshaftFiltersBoundingBox(new MapModelBoundingBoxAdapter(this.map))
    });
  });

  it('should reload map and force fetch on changing attrs', function () {
    engineMock.reload.calls.reset();
    this.model.set('column', 'random_col');
    expect(engineMock.reload).toHaveBeenCalledWith({ forceFetch: true, sourceId: 'a0' });

    engineMock.reload.calls.reset();
    this.model.set('aggregation', 'count');
    expect(engineMock.reload).toHaveBeenCalledWith({ forceFetch: true, sourceId: 'a0' });

    engineMock.reload.calls.reset();
    this.model.set('aggregation_column', 'other');
    expect(engineMock.reload).toHaveBeenCalledWith({ forceFetch: true, sourceId: 'a0' });
  });

  it('should define several internal models/collections', function () {
    expect(this.model._data).toBeDefined();
    expect(this.model._searchModel).toBeDefined();
    expect(this.model.filter).toBeDefined();
  });

  it('should set the api_key attribute on the internal models', function () {
    this.model = new CategoryDataviewModel({
      source: this.source
    }, {
      map: this.map,
      engine: engineMock,
      layer: jasmine.createSpyObj('layer', ['get']),
      filter: new WindshaftFiltersCategory()
    });

    expect(this.model._searchModel.get('apiKey')).toEqual(apiKey);
    expect(this.model._rangeModel.get('apiKey')).toEqual(apiKey);
  });

  describe('.url', function () {
    it('should include the bbox,own_filter and categories parameters', function () {
      expect(this.model.set('url', 'http://example.com'));
      expect(this.model.url()).toEqual('http://example.com?bbox=2,1,4,3&own_filter=0&categories=6&' + apiKeyQueryParam);

      this.model.set('filterEnabled', true);

      expect(this.model.url()).toEqual('http://example.com?bbox=2,1,4,3&own_filter=1&categories=6&' + apiKeyQueryParam);

      this.model.set('filterEnabled', false);

      expect(this.model.url()).toEqual('http://example.com?bbox=2,1,4,3&own_filter=0&categories=6&' + apiKeyQueryParam);

      this.model.set('categories', 1);

      expect(this.model.url()).toEqual('http://example.com?bbox=2,1,4,3&own_filter=0&categories=1&' + apiKeyQueryParam);
    });
  });

  describe('binds', function () {
    beforeEach(function () {
      this.model.set({
        url: 'http://heytest.io'
      });
    });

    describe('url', function () {
      beforeEach(function () {
        spyOn(this.model, 'fetch');
        spyOn(this.model._searchModel, 'fetch');
        spyOn(this.model._rangeModel, 'fetch');
      });

      it('should set search url when it changes', function () {
        expect(this.model._searchModel.get('url')).toBe('http://heytest.io');
        expect(this.model._searchModel.url()).toBe('http://heytest.io/search?q=&' + apiKeyQueryParam);
      });

      it('should set rangeModel url when it changes', function () {
        expect(this.model._rangeModel.get('url')).toBe('http://heytest.io');
        expect(this.model._rangeModel.url()).toBe('http://heytest.io?' + apiKeyQueryParam);
      });
    });

    describe('search events dispatcher', function () {
      var eventNames = ['loading', 'loaded', 'error'];
      _.each(eventNames, function (eventName) {
        it("should re-trigger the '" + eventName + "' event", function () {
          var spyObj = jasmine.createSpy(eventName);
          this.model.bind(eventName, spyObj);

          this.model._searchModel.trigger(eventName);

          expect(spyObj).toHaveBeenCalled();
        });
      }, this);

      describe('on search data change', function () {
        beforeEach(function () {
          spyOn(this.model, 'trigger');
          this.model.filter.accept(['hey']);
          this.model._searchModel.setData([{ name: 'hey', value: 1 }, { name: 'vamos', value: 2 }, { name: 'neno', value: 3 }]);
        });

        it('should check if search results are already selected or not', function () {
          var data = this.model.getSearchResult();
          expect(data.size()).toBe(3);
          var selectedCategories = data.where({ selected: true });
          var selectedCategory = selectedCategories[0];
          expect(_.size(selectedCategories)).toBe(1);
          expect(selectedCategory.get('name')).toBe('hey');
        });

        it('should trigger searchData event', function () {
          expect(this.model.trigger).toHaveBeenCalledWith('change:searchData', this.model);
        });
      });
    });

    describe('range model', function () {
      it('should set totalCount when rangeModel has changed', function () {
        expect(this.model.get('totalCount')).toBeUndefined();
        this.model._rangeModel.set({ totalCount: 1000 });
        expect(this.model.get('totalCount')).toBe(1000);
      });

      it('should set categoriesCount when rangeModel has changed', function () {
        expect(this.model.get('categoriesCount')).toBeUndefined();
        this.model._rangeModel.set({ categoriesCount: 123 });
        expect(this.model.get('categoriesCount')).toBe(123);
      });
    });
  });

  describe('bindings to map bounds', function () {
    beforeEach(function () {
      // Disable debounce
      this.model._bboxFilter._stopBinds();
      this.model._bboxFilter._initBinds();

      this.model.fetch = function (opts) {
        opts && opts.success();
      };
      this.model.set('url', 'http://example.com');
    });

    it('should fetch when the bounding box has changed', function () {
      spyOn(this.model._searchModel, 'fetchIfSearchIsApplied');

      this.map.getViewBounds.and.returnValue([200, 200], [300, 400]);
      this.map.trigger('change:center');

      expect(this.model._searchModel.fetchIfSearchIsApplied).toHaveBeenCalled();
    });
  });

  describe('search model helpers', function () {
    it('should clean search properly', function () {
      spyOn(this.model._searchModel, 'resetData');
      this.model.cleanSearch();
      expect(this.model._searchModel.resetData).toHaveBeenCalled();
    });

    describe('setupSearch', function () {
      beforeEach(function () {
        spyOn(this.model._searchModel, 'setData').and.callThrough();
      });

      it('should not setup search if search is already applied', function () {
        spyOn(this.model, 'isSearchApplied').and.returnValue(true);
        this.model.setupSearch();
        expect(this.model._searchModel.setData).not.toHaveBeenCalled();
      });

      it('should setup search if it is gonna be enabled', function () {
        spyOn(this.model, 'isSearchApplied').and.returnValue(false);
        _parseData(this.model, _generateData(3));
        this.model.filter.accept(['4', '5', '6']);
        this.model.setupSearch();
        expect(this.model._searchModel.setData).toHaveBeenCalled();
        expect(this.model.getSearchCount()).toBe(3);
      });
    });
  });

  it('should refresh its own data only if the search is not applied', function () {
    spyOn(this.model, 'fetch');
    spyOn(this.model._searchModel, 'fetch');
    this.model.refresh();
    expect(this.model.fetch.calls.count()).toEqual(1);
    expect(this.model.fetch).toHaveBeenCalled();
    expect(this.model._searchModel.fetch).not.toHaveBeenCalled();
    spyOn(this.model, 'isSearchApplied').and.returnValue(true);
    this.model.refresh();
    expect(this.model._searchModel.fetch).toHaveBeenCalled();
    expect(this.model.fetch.calls.count()).toEqual(1);
  });

  describe('filters over data', function () {
    beforeEach(function () {
      this.model._data.reset([{ name: 'one', value: 1 }, { name: 'buddy', value: 2 }, { name: 'neno', value: 3 }]);
    });

    describe('.numberOfAcceptedCategories', function () {
      it('should count accepted categories over the current data', function () {
        this.model.filter.accept('vamos');
        expect(this.model.numberOfAcceptedCategories()).toBe(0);
        this.model.filter.accept('buddy');
        expect(this.model.numberOfAcceptedCategories()).toBe(1);
        this.model.filter.reject('neno');
        expect(this.model.numberOfAcceptedCategories()).toBe(2);
        this.model._data.reset([]);
        expect(this.model.numberOfAcceptedCategories()).toBe(0);
      });
    });

    describe('.numberOfRejectedCategories', function () {
      it('should count rejected categories over the current data', function () {
        this.model.filter.reject('vamos');
        expect(this.model.numberOfRejectedCategories()).toBe(0);
        this.model.filter.reject('buddy');
        expect(this.model.numberOfRejectedCategories()).toBe(1);
        this.model.filter.accept('neno');
        expect(this.model.numberOfRejectedCategories()).toBe(1);
        this.model._data.reset([]);
        expect(this.model.numberOfRejectedCategories()).toBe(0);
      });
    });
  });

  describe('.parse', function () {
    it('should change internal data collection when parse is called', function () {
      var resetSpy = jasmine.createSpy('reset');
      this.model._data.bind('reset', resetSpy);

      _parseData(this.model, _generateData(2));
      expect(resetSpy).toHaveBeenCalled();
    });

    describe('when filter is disabled', function () {
      it('should NOT add categories that are accepted when they are not present in the new categories', function () {
        this.model.filter.accept('Madrid');

        this.model.disableFilter();

        _parseData(this.model, _.map(['Barcelona'], function (v) {
          return {
            category: v,
            value: 1
          };
        }));

        var categories = this.model.get('data');
        expect(categories.length).toEqual(1);
        expect(categories[0].name).toEqual('Barcelona');
      });
    });

    describe('when filter is enabled', function () {
      it('should add categories that are accepted when they are not present in the new categories', function () {
        this.model.filter.accept('Madrid');

        this.model.enableFilter();

        _parseData(this.model, _.map(['Barcelona'], function (v) {
          return {
            category: v,
            value: 1
          };
        }));

        var categories = this.model.get('data');
        expect(categories.length).toEqual(2);
        expect(categories[0].name).toEqual('Barcelona');
        expect(categories[1].name).toEqual('Madrid');
      });
    });
  });

  describe('.update', function () {
    beforeEach(function () {
      expect(this.model.get('foo')).toBeUndefined();
      expect(this.model.get('sync_on_bbox_change')).toBe(true);
      expect(this.model.get('aggregation')).not.toEqual('sum');
      this.model.update({
        sync_on_bbox_change: false,
        aggregation: 'sum',
        foo: 'bar'
      });
    });

    it('should allow to set attrs but only the defined ones', function () {
      expect(this.model.get('sync_on_bbox_change')).toBe(false);
      expect(this.model.get('aggregation')).toEqual('sum');
      expect(this.model.get('foo')).toBeUndefined();
    });
  });

  describe('.getCount', function () {
    it('returns the total number of categories', function () {
      this.model.set('categoriesCount', 99999);

      expect(this.model.getCount()).toEqual(99999);
    });
  });
});

function _generateData (n) {
  return _.times(n, function (i) {
    return {
      category: i,
      value: 2
    };
  });
}

function _parseData (model, categories) {
  model.sync = function (method, model, options) {
    options.success({
      'categories': categories
    });
  };
  model.fetch();
}
