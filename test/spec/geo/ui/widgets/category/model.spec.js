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
