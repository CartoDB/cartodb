var CategoryFilter = require('../../../../src/windshaft/filters/category');

describe('windshaft/filters/category', function () {
  var categoryFilter;

  beforeEach(function () {
    categoryFilter = new CategoryFilter({
      column_type: 'number',
      dataviewId: 'dataview-001'
    });
    categoryFilter.acceptedCategories.reset([{name: 'foo'}, {name: 'bar'}]);

    spyOn(categoryFilter, 'cleanFilter');
  });

  it('accept', function () {
    expect(categoryFilter.acceptedCategories.size()).toBe(2);
    categoryFilter.accept('fiu');
    expect(categoryFilter.acceptedCategories.size()).toBe(3);
  });

  it('reject', function () {
    expect(categoryFilter.acceptedCategories.size()).toBe(2);
    categoryFilter.reject('foo');
    expect(categoryFilter.acceptedCategories.size()).toBe(1);
  });

  it('remove', function () {
    categoryFilter.reject('foo');
    expect(categoryFilter.acceptedCategories.size()).toBe(1);

    categoryFilter.remove();

    expect(categoryFilter.cleanFilter).toHaveBeenCalled();

    var json = categoryFilter.toJSON()['dataview-001'];
    expect(json.rejectCount).toBeFalsy();
    expect(json.acceptCount).toBeFalsy();
  });
});
