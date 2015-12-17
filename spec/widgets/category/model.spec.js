var _ = require('underscore');
var CategoryModel = require('../../../src/widgets/category/model.js');
var WindshaftFiltersCategory = require('../../../src/windshaft/filters/category');

describe('widgets/category/model', function () {
  beforeEach(function () {
    this.model = new CategoryModel(null, {
      filter: new WindshaftFiltersCategory()
    });
  });

  it('should define several internal models/collections', function () {
    expect(this.model._data).toBeDefined();
    expect(this.model.search).toBeDefined();
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
        spyOn(this.model.search, 'fetch');
        spyOn(this.model.rangeModel, 'fetch');
      });

      it('should set search url when it changes', function () {
        expect(this.model.search.get('url')).toBe('http://heytest.io');
        expect(this.model.search.url()).toBe('http://heytest.io/search?q=');
      });

      it('should set rangeModel url when it changes', function () {
        expect(this.model.rangeModel.get('url')).toBe('http://heytest.io');
        expect(this.model.rangeModel.url()).toBe('http://heytest.io');
      });
    });

    describe('boundingBox', function () {
      it('should set search boundingBox when it changes', function () {
        expect(this.model.search.get('boundingBox')).toBeUndefined();
        this.model.set('boundingBox', 'hey');
        expect(this.model.search.get('boundingBox')).toBe('hey');
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
          _.bind(eventDispatcher, this)(this.model.search, eventName);
        }, this);
      });

      it('should trigger a change:searchData when search model is fetched', function () {
        _.bind(eventDispatcher, this)(this.model.search, 'change:data', 'change:searchData');
      });
    });

    describe('locked collection', function () {
      it('should trigger any change done over locked collection', function () {
        var eventNames = ['change', 'add', 'remove'];
        _.each(eventNames, function (eventName) {
          _.bind(eventDispatcher, this)(this.model.locked, eventName, 'change:lockCollection');
        }, this);
      });
    });

    describe('range model', function () {
      it('should set totalCount when rangeModel has changed', function () {
        expect(this.model.get('totalCount')).toBeUndefined();
        this.model.rangeModel.trigger('change:totalCount', this, 1000);
        expect(this.model.get('totalCount')).toBe(1000);
      });
    });
  });

  describe('category colors', function () {
    it('should enable category colors', function () {
      var applySpy = jasmine.createSpy('apply');
      this.model.bind('applyCategoryColors', applySpy);
      this.model.applyCategoryColors();
      expect(applySpy).toHaveBeenCalled();
      expect(this.model.get('categoryColors')).toBeTruthy();
    });

    it('should disable category colors', function () {
      var cancelSpy = jasmine.createSpy('cancel');
      this.model.bind('cancelCategoryColors', cancelSpy);
      this.model.cancelCategoryColors();
      expect(cancelSpy).toHaveBeenCalled();
      this.model.cancelCategoryColors();
      expect(this.model.get('categoryColors')).toBeFalsy();
    });
  });

  describe('locked collection helpers', function () {
    describe('canApplyLocked', function () {
      beforeEach(function () {
        this.model.filter.accept(['Hey', 'Neno']);
      });

      it('could apply locked when accepted filter collection size is different than locked collection', function () {
        this.model.locked.addItems({ name: 'Neno' });
        expect(this.model.canApplyLocked()).toBeTruthy();
      });

      it('could apply locked when accepted filter has different items then locked', function () {
        this.model.locked.addItems([{ name: 'Neno' }, { name: 'Comeon' }]);
        expect(this.model.canApplyLocked()).toBeTruthy();
        this.model.locked.reset();
        expect(this.model.canApplyLocked()).toBeTruthy();
      });

      it('could not apply locked when accepted filter has same items than locked collection', function () {
        this.model.locked.addItems([{ name: 'Neno' }, { name: 'Hey' }]);
        expect(this.model.canApplyLocked()).toBeFalsy();
      });
    });

    describe('applyLocked', function () {
      beforeEach(function () {
        this.model.locked.reset([{ name: 'Hey', value: 1 }]);
        spyOn(this.model, 'unlockCategories');
        spyOn(this.model.filter, 'applyFilter');
        spyOn(this.model, 'cleanSearch');
      });

      it('should apply locked state properly', function () {
        this.model.applyLocked();
        expect(this.model.unlockCategories).not.toHaveBeenCalled();
        expect(this.model.cleanSearch).toHaveBeenCalled();
        expect(this.model.getAcceptedCount()).toBe(1);
        expect(this.model.filter.applyFilter).toHaveBeenCalled();
      });

      it('should remove previous accept filters', function () {
        this.model.acceptFilters('Comeon');
        this.model.applyLocked();
        expect(this.model.filter.isAccepted('Comeon')).toBeFalsy();
      });

      it('should "unlock" categories if locked collection is empty', function () {
        this.model.locked.reset();
        this.model.applyLocked();
        expect(this.model.unlockCategories).toHaveBeenCalled();
        expect(this.model.cleanSearch).not.toHaveBeenCalled();
        expect(this.model.filter.applyFilter).not.toHaveBeenCalled();
      });
    });

    describe('locked/unlocked', function () {
      beforeEach(function () {
        spyOn(this.model, '_fetch');
        spyOn(this.model, 'acceptAll');
      });

      it('should lock widget', function () {
        this.model.lockCategories();
        expect(this.model.get('locked')).toBeTruthy();
        expect(this.model._fetch).toHaveBeenCalled();
      });

      it('should unlock widget', function () {
        this.model.unlockCategories();
        expect(this.model.get('locked')).toBeFalsy();
        expect(this.model._fetch).not.toHaveBeenCalled();
        expect(this.model.acceptAll).toHaveBeenCalled();
      });
    });
  });

  describe('search model helpers', function () {
    it('should clean search properly', function () {
      spyOn(this.model.locked, 'resetItems');
      spyOn(this.model.search, 'resetData');
      this.model.cleanSearch();
      expect(this.model.locked.resetItems).toHaveBeenCalled();
      expect(this.model.search.resetData).toHaveBeenCalled();
    });

    describe('setupSeach', function () {
      beforeEach(function () {
        spyOn(this.model.locked, 'addItems').and.callThrough();
        spyOn(this.model.search, 'setData').and.callThrough();
      });

      it('should not setup search if search is already applied', function () {
        spyOn(this.model, 'isSearchApplied').and.returnValue(true);
        this.model.setupSearch();
        expect(this.model.locked.addItems).not.toHaveBeenCalled();
        expect(this.model.search.setData).not.toHaveBeenCalled();
      });

      it('should setup search if it is gonna be enabled', function () {
        spyOn(this.model, 'isSearchApplied').and.returnValue(false);
        this.model.setCategories(_generateData(3));
        this.model.acceptFilters(['4', '5', '6']);
        this.model.setupSearch();
        expect(this.model.locked.addItems).toHaveBeenCalled();
        expect(this.model.search.setData).toHaveBeenCalled();
        expect(this.model.getLockedSize()).toBe(3);
        expect(this.model.getSearchCount()).toBe(3);
      });
    });
  });

  it('should refresh its own data only if the search is not applied', function () {
    spyOn(this.model, '_fetch');
    spyOn(this.model.search, 'fetch');
    this.model.refresh();
    expect(this.model._fetch.calls.count()).toEqual(1);
    expect(this.model._fetch).toHaveBeenCalled();
    expect(this.model.search.fetch).not.toHaveBeenCalled();
    spyOn(this.model, 'isSearchApplied').and.returnValue(true);
    this.model.refresh();
    expect(this.model.search.fetch).toHaveBeenCalled();
    expect(this.model._fetch.calls.count()).toEqual(1);
  });

  describe('parseData', function () {
    it('should provide data as an object', function () {
      var r = this.model._parseData(_generateData(10));
      expect(r.data).toBeDefined();
      expect(r.data.length).toBe(10);
    });

    it('should assign a color to each category', function () {
      var r = this.model._parseData(_generateData(10));
      var areColored = true;
      _.each(r.data, function (item) {
        if (!item.color) {
          areColored = false;
        }
      });
      expect(areColored).toBeTruthy();
    });

    it('should complete data with accepted items (if they are not present already) when widget is locked', function () {
      spyOn(this.model, 'isLocked').and.returnValue(true);
      this.model.acceptFilters(['9', '10', '11']);
      var r = this.model._parseData(_generateData(8));
      expect(r.data.length).toBe(11);

      this.model.acceptFilters(['2']);
      // It will be repeated in the data array
      r = this.model._parseData(_generateData(8));
      expect(r.data.length).toBe(11);
    });
  });

  it('should provide a function for setting categories directly', function () {
    expect(this.model.setCategories).toBeDefined();
    var changeSpy = jasmine.createSpy('change');
    this.model.bind('change', changeSpy);
    this.model.setCategories(_generateData(9));
    expect(this.model._data.size()).toBe(9);
    expect(this.model.get('data').length).toBe(9);
    expect(changeSpy).toHaveBeenCalled();

    spyOn(this.model, 'applyCategoryColors');
    spyOn(this.model, 'isColorApplied').and.returnValue(true);
    this.model.setCategories(_generateData(9));
    expect(this.model.applyCategoryColors).toHaveBeenCalled();
  });

  describe('parse', function () {
    it('should change internal data collection when parse is called', function () {
      var resetSpy = jasmine.createSpy('reset');
      this.model._data.bind('reset', resetSpy);
      this.model.parse({
        categories: _generateData(2)
      });
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should send applied colors if it is enabled', function () {
      spyOn(this.model, 'applyCategoryColors');
      spyOn(this.model, 'isColorApplied').and.returnValue(true);
      this.model.parse({
        categories: _generateData(2)
      });
      expect(this.model.applyCategoryColors).toHaveBeenCalled();
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
