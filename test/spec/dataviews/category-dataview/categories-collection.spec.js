var Backbone = require('Backbone');
var CategoriesCollection = require('../../../../src/dataviews/category-dataview/categories-collection');

describe('categories-collection', function () {
  var aggregationModel;
  var collection;

  beforeEach(function () {
    aggregationModel = new Backbone.Model({
      aggregation: 'count'
    });

    spyOn(CategoriesCollection.prototype, 'filterNull').and.callThrough();
    spyOn(CategoriesCollection.prototype, 'reset').and.callThrough();

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

    collection.reset.calls.reset();
    expect(CategoriesCollection.prototype.filterNull).toHaveBeenCalled();
    expect(CategoriesCollection.prototype.reset).not.toHaveBeenCalled();
    expect(collection.length).toBe(3);

    aggregationModel.set({aggregation: 'avg'});
    expect(CategoriesCollection.prototype.filterNull).toHaveBeenCalled();
    expect(CategoriesCollection.prototype.reset).toHaveBeenCalled();
    expect(collection.length).toBe(2);
  });
});
