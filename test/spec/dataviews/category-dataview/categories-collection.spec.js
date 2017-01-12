var Backbone = require('backbone');
var CategoriesCollection = require('../../../../src/dataviews/category-dataview/categories-collection');

describe('categories-collection', function () {
  var aggregationModel;
  var collection;

  beforeEach(function () {
    aggregationModel = new Backbone.Model({
      aggregation: 'count'
    });

    collection = new CategoriesCollection(null, {
      aggregationModel: aggregationModel
    });
  });

  it('reset should filter null when reset', function () {
    collection.reset([{
      name: 'foo',
      value: 1
    }, {
      name: 'bar',
      value: 10
    }, {
      name: 'wadus',
      value: null
    }]);

    expect(collection.length).toBe(3);
    expect(collection.pluck('name').sort()).toEqual([ 'foo', 'bar', 'wadus' ].sort());
    expect(collection.pluck('value').sort()).toEqual([ 1, 10, null ].sort());

    aggregationModel.set({aggregation: 'avg'});

    collection.reset([{
      name: 'foo',
      value: 1
    }, {
      name: 'bar',
      value: 10
    }, {
      name: 'wadus',
      value: null
    }]);
    expect(collection.length).toBe(2);
    expect(collection.pluck('name').sort()).toEqual([ 'foo', 'bar' ].sort());
    expect(collection.pluck('value').sort()).toEqual([ 1, 10 ].sort());
  });
});
