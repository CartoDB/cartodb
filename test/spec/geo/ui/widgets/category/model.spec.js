var _ = require('underscore');
var CategoryModel = require('cdb/geo/ui/widgets/category/model.js');
var WindshaftFiltersCategory = require('cdb/windshaft/filters/category');

describe('widgets/category/model', function() {

  beforeEach(function() {
    this.model = new CategoryModel(null, {
      filter: new WindshaftFiltersCategory()
    });
  });

  it('should define an internal collection', function() {
    expect(this.model._data).toBeDefined();
  });

  describe('parseData', function() {

    xit('should provide data and stats as an object', function() {
      var r = this.model._parseData();
      expect(r.max).toBeDefined();
      expect(r.min).toBeDefined();
      expect(r.avg).toBeDefined();
      expect(r.data).toBeDefined();
      expect(r.data.length).toBe(0);
    });

    it('should provide data and stats as an object', function() {
      var r = this.model._parseData(_generateData(2));
      expect(r.data.length).toBe(2);
    });

  });

  describe('dataOrigin', function() {
    it('should define _dataOrigin from the beginning', function() {
      expect(this.model._dataOrigin).toBeDefined();
    });

    it('should change _dataOrigin if data is empty at the beginning', function() {
      var callback = jasmine.createSpy('callback');
      this.model._dataOrigin.bind('reset', callback, this.model);
      this.model.setCategories([{ name: 1, value: 2 }]);
      expect(callback).toHaveBeenCalled();
    });
  });

  it('should have a public method to set new categories', function() {
    expect(this.model.setCategories).toBeDefined();
    var callback = jasmine.createSpy('callback');
    this.model.bind('change', callback, this.model);
    this.model.setCategories([{ name: 1, value: 2 }]);
    expect(callback).toHaveBeenCalled();
  });

  it('should have defined "_onFilterChanged" method', function() {
    expect(this.model._onFilterChanged).toBeDefined();
  })

});

function _generateData(n) {
  return _.times(n, function(i) {
    return {
      category: i,
      value: 2
    }
  });
}
