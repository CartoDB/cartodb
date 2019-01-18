const FiltersCollection = require('../../../../../src/api/v4/filter/filters-collection');
const carto = require('../../../../../src/api/v4/index');

const column = 'fake_column';

describe('api/v4/filter/filters-collection', function () {
  describe('constructor', function () {
    it('should call _initialize', function () {
      spyOn(FiltersCollection.prototype, '_initialize');
      new FiltersCollection(); // eslint-disable-line

      expect(FiltersCollection.prototype._initialize).toHaveBeenCalled();
    });
  });

  describe('._initialize', function () {
    it('should set an empty array to filters', function () {
      const filtersCollection = new FiltersCollection();
      expect(filtersCollection._filters).toEqual([]);
    });

    it('should set provided filters and call add()', function () {
      spyOn(FiltersCollection.prototype, 'addFilter').and.callThrough();

      const filters = [
        new carto.filter.Range(column, { lt: 1 }),
        new carto.filter.Category(column, { in: ['category'] })
      ];
      const filtersCollection = new FiltersCollection(filters);

      expect(filtersCollection._filters).toEqual(filters);
      expect(FiltersCollection.prototype.addFilter).toHaveBeenCalledTimes(2);
    });
  });

  describe('.addFilter', function () {
    let filtersCollection, rangeFilter, triggerFilterChangeSpy, listenToChangeSpy;

    beforeEach(function () {
      triggerFilterChangeSpy = spyOn(FiltersCollection.prototype, '_triggerFilterChange');
      listenToChangeSpy = spyOn(FiltersCollection.prototype, 'listenTo');
      filtersCollection = new FiltersCollection();
      rangeFilter = new carto.filter.Range(column, { lt: 1 });
    });

    it('should throw an error if filter is not an instance of SQLBase or FiltersCollection', function () {
      expect(function () {
        filtersCollection.addFilter({});
      }).toThrowError('Filters need to extend from carto.filter.SQLBase. Please use carto.filter.Category or carto.filter.Range.');
    });

    it('should not readd a filter if it is already added', function () {
      filtersCollection.addFilter(rangeFilter);
      filtersCollection.addFilter(rangeFilter);

      expect(filtersCollection._filters.length).toBe(1);
      expect(triggerFilterChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('should add new filter and trigger change:filters event', function () {
      filtersCollection.addFilter(rangeFilter);

      expect(filtersCollection._filters.length).toBe(1);
      expect(triggerFilterChangeSpy).toHaveBeenCalledTimes(1);
    });

    it('should register listener to change:filters event in the added filter', function () {
      filtersCollection.addFilter(rangeFilter);

      expect(listenToChangeSpy).toHaveBeenCalled();
      expect(listenToChangeSpy.calls.mostRecent().args[0]).toBe(rangeFilter);
      expect(listenToChangeSpy.calls.mostRecent().args[1]).toEqual('change:filters');
    });
  });

  describe('.removeFilter', function () {
    let filtersCollection, rangeFilter, triggerFilterChangeSpy;

    beforeEach(function () {
      triggerFilterChangeSpy = spyOn(FiltersCollection.prototype, '_triggerFilterChange');
      filtersCollection = new FiltersCollection();
      rangeFilter = new carto.filter.Range(column, { lt: 1 });
    });

    it('should not remove the filter if it was not already added', function () {
      const removedElement = filtersCollection.removeFilter(rangeFilter);

      expect(removedElement).toBeUndefined();
      expect(triggerFilterChangeSpy).not.toHaveBeenCalled();
    });

    it('should remove the filter if it was already added', function () {
      filtersCollection.addFilter(rangeFilter);

      const removedElement = filtersCollection.removeFilter(rangeFilter);

      expect(removedElement).toBe(rangeFilter);
      expect(triggerFilterChangeSpy).toHaveBeenCalled();
    });
  });

  describe('.count', function () {
    let filtersCollection, rangeFilter;

    beforeEach(function () {
      filtersCollection = new FiltersCollection();
      rangeFilter = new carto.filter.Range(column, { lt: 1 });
      filtersCollection.addFilter(rangeFilter);
    });

    it('should return filters length', function () {
      expect(filtersCollection.count()).toBe(1);
    });
  });

  describe('.getFilters', function () {
    let filtersCollection, rangeFilter;

    beforeEach(function () {
      filtersCollection = new FiltersCollection();
      rangeFilter = new carto.filter.Range(column, { lt: 1 });
      filtersCollection.addFilter(rangeFilter);
    });

    it('should return added filters', function () {
      expect(filtersCollection.getFilters()).toEqual([rangeFilter]);
    });
  });

  describe('.$getSQL', function () {
    let filtersCollection;

    beforeEach(function () {
      let rangeFilter = new carto.filter.Range(column, { lt: 1 });
      let categoryFilter = new carto.filter.Category(column, { in: ['category'] });

      filtersCollection = new FiltersCollection();
      filtersCollection.addFilter(rangeFilter);
      filtersCollection.addFilter(categoryFilter);
    });

    it('should build the SQL string and join filters', function () {
      expect(filtersCollection.$getSQL()).toEqual("(fake_column < 1 AND fake_column IN ('category'))");
    });

    it('should not take empty filters into account', function () {
      let customRangeFilter = new carto.filter.Range(column, { lt: 1 });
      let emptyFilter = new carto.filter.Category(column, {});

      filtersCollection = new FiltersCollection();
      filtersCollection.addFilter(customRangeFilter);
      filtersCollection.addFilter(emptyFilter);

      expect(filtersCollection.$getSQL()).toEqual('fake_column < 1');
    });
  });

  describe('._triggerFilterChange', function () {
    let filtersCollection;

    beforeEach(function () {
      filtersCollection = new FiltersCollection();
    });

    it('should trigger change:filters', function () {
      spyOn(filtersCollection, 'trigger');

      const filters = [];
      filtersCollection._triggerFilterChange(filters);

      expect(filtersCollection.trigger).toHaveBeenCalledWith('change:filters', filters);
    });
  });
});
