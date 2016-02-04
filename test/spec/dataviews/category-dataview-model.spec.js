var _ = require('underscore');
var CategoryDataviewModel = require('../../../src/dataviews/category-dataview-model.js');
var WindshaftFiltersCategory = require('../../../src/windshaft/filters/category');

describe('dataviews/category-dataview-model', function () {
  beforeEach(function () {
    var map = jasmine.createSpyObj('map', ['getViewBounds', 'bind', 'reload']);
    map.getViewBounds.and.returnValue([[1, 2], [3, 4]]);
    var windshaftMap = jasmine.createSpyObj('windhsaftMap', ['bind']);
    this.model = new CategoryDataviewModel(null, {
      map: map,
      windshaftMap: windshaftMap,
      layer: jasmine.createSpyObj('layer', ['get', 'getDataProvider']),
      filter: new WindshaftFiltersCategory()
    });
  });

  it('should define several internal models/collections', function () {
    expect(this.model._data).toBeDefined();
    expect(this.model._searchModel).toBeDefined();
    expect(this.model.filter).toBeDefined();
  });

  describe('binds', function () {
    beforeEach(function () {
      this.model.set({
        url: 'http://heytest.io'
      });
      // Simulating first interaction with client.js
      this.model._onChangeBinds();
    });

    describe('url', function () {
      beforeEach(function () {
        spyOn(this.model, 'fetch');
        spyOn(this.model._searchModel, 'fetch');
        spyOn(this.model._rangeModel, 'fetch');
      });

      it('should set search url when it changes', function () {
        expect(this.model._searchModel.get('url')).toBe('http://heytest.io');
        expect(this.model._searchModel.url()).toBe('http://heytest.io/search?q=');
      });

      it('should set rangeModel url when it changes', function () {
        expect(this.model._rangeModel.get('url')).toBe('http://heytest.io');
        expect(this.model._rangeModel.url()).toBe('http://heytest.io');
      });
    });

    describe('boundingBox', function () {
      it('should set search boundingBox when it changes', function () {
        this.model.set('boundingBox', 'hey');
        expect(this.model._searchModel.get('boundingBox')).toBe('hey');
      });

      it('should fetch itself if bounding box changes only when search is not applied', function () {
        spyOn(this.model, '_fetch');
        spyOn(this.model, 'isSearchApplied').and.returnValue(true);
        this.model.set('boundingBox', 'comeon');
        expect(this.model._fetch).not.toHaveBeenCalled();
      });
    });

    describe('search events dispatcher', function () {
      it('should trigger search related events', function () {
        var eventNames = ['loading', 'sync', 'error'];
        _.each(eventNames, function (eventName) {
          _.bind(eventDispatcher, this)(this.model._searchModel, eventName);
        }, this);
      });

      it('should trigger a change:searchData when search model is fetched', function () {
        _.bind(eventDispatcher, this)(this.model._searchModel, 'change:data', 'change:searchData');
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
    spyOn(this.model, '_fetch');
    spyOn(this.model._searchModel, 'fetch');
    this.model.refresh();
    expect(this.model._fetch.calls.count()).toEqual(1);
    expect(this.model._fetch).toHaveBeenCalled();
    expect(this.model._searchModel.fetch).not.toHaveBeenCalled();
    spyOn(this.model, 'isSearchApplied').and.returnValue(true);
    this.model.refresh();
    expect(this.model._searchModel.fetch).toHaveBeenCalled();
    expect(this.model._fetch.calls.count()).toEqual(1);
  });

  describe('parseData', function () {
    it('should provide data as an object', function () {
      _parseData(this.model, _generateData(10));
      var data = this.model.get('data');
      expect(data).toBeDefined();
      expect(data.length).toBe(10);
    });

    it('should complete data with accepted items (if they are not present already) when has ownFilter set', function () {
      this.model.set('ownFilter', true);
      this.model.filter.accept(['9', '10', '11']);
      _parseData(this.model, _generateData(8));
      var data = this.model.get('data');
      expect(data.length).toBe(11);

      this.model.filter.accept(['2']);
      // The '2' should not be repeated in the data array
      _parseData(this.model, _generateData(8));
      data = this.model.get('data');
      expect(data.length).toBe(11);
    });
  });

  describe('.parse', function () {
    it('should change internal data collection when parse is called', function () {
      var resetSpy = jasmine.createSpy('reset');
      this.model._data.bind('reset', resetSpy);

      _parseData(this.model, _generateData(2));
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should cast any category value to string', function () {
      _parseData(this.model, _.map([null, undefined, 0, 'hello', false], function (v) {
        return {
          category: v,
          value: 1
        };
      }));
      var areNamesString = _.every(this.model.get('data'), function (obj) {
        return obj.name;
      });
      expect(areNamesString).toBeTruthy();
    });
  });

  it('should have defined "_onFilterChanged" method', function () {
    expect(this.model._onFilterChanged).toBeDefined();
  });
});

function eventDispatcher (originModel, eventName, triggerName) {
  var spyObj = jasmine.createSpy(eventName);
  this.model.bind(triggerName || eventName, spyObj);
  originModel.trigger(eventName);
  expect(spyObj).toHaveBeenCalled();
}

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
