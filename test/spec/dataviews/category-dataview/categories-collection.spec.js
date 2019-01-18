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

  describe('.reset', function () {
    it('should NOT filter null values when categories are aggregated by "count"', function () {
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
    });

    it('should filter null values when categories are NOT aggregated by "count"', function () {
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
});
