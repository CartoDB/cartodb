var _ = require('underscore');
var WindshaftFiltersCategory = require('cdb/windshaft/filters/category');

describe('windshaft/filters/category', function() {
  beforeEach(function() {
    this.filter = new WindshaftFiltersCategory({
      widgetId: 'category_widget'
    });
  });

  it('should generate an internal collection for adding rejected items', function() {
    expect(this.filter.rejectedCategories).toBeDefined();
  });

  it('should be empty when there is no rejected items within internal collection', function() {
    expect(this.filter.isEmpty()).toBeTruthy();
    this.filter.reject('pepito');
    expect(this.filter.isEmpty()).toBeFalsy();
  });

  describe('accept', function() {
    beforeEach(function() {
      this.filter.reject(['pepito', 'juanito', 'jaimito']);
    });

    it('should accept an array or a string as an argument', function() {
      var rejectedCats = this.filter.getRejected();
      this.filter.accept('pepito');
      expect(rejectedCats.size()).toBe(2);
      this.filter.accept(['jaimito']);
      expect(rejectedCats.size()).toBe(1);
    });

    it('should trigger change event when value is accepted', function() {
      var callback = jasmine.createSpy('callback');
      this.filter.bind('change', callback, this.filter);
      this.filter.accept('pepito');
      expect(callback).toHaveBeenCalled();
    });

    it('should remove value from rejected when it is accepted', function() {
      this.filter.accept('pepito');
      var rejectedCats = this.filter.getRejected();
      expect(rejectedCats.size()).toBe(2);
      expect(rejectedCats.where({ name: 'pepito' }).length).toBe(0);
    });
  });

  describe('reject', function() {
    it('should add the item in the internal collection and send the trigger', function() {
      var callback = jasmine.createSpy('callback');
      var rejectedCats = this.filter.getRejected();
      this.filter.bind('change', callback, this.filter);
      this.filter.reject('pepito');
      expect(rejectedCats.size()).toBe(1);
      expect(callback).toHaveBeenCalled();
    });
    it('should accept an array or a string as an argument', function() {
      var rejectedCats = this.filter.getRejected();
      this.filter.reject('pepito');
      expect(rejectedCats.size()).toBe(1);
      this.filter.reject(['jaimito', 'miguelito']);
      expect(rejectedCats.size()).toBe(3);
    });
    it('should not add an item (and trigger change event) if it is already in the internal collection', function() {
      var rejectedCats = this.filter.getRejected();
      this.filter.reject('pepito');
      expect(rejectedCats.size()).toBe(1);
      var callback = jasmine.createSpy('callback');
      this.filter.reject('pepito');
      expect(rejectedCats.size()).toBe(1);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('toJSON', function() {
    it('should generate an object with reject attribute when it is serialized', function() {
      this.filter.reject(['pepito', 'miguelito']);
      this.filter.accept('paco');
      var result = this.filter.toJSON();
      expect(result['category_widget']).toBeDefined();
      expect(result['category_widget']['reject']).toBeDefined();
      expect(result['category_widget']['accept']).not.toBeDefined();
      expect(_.isArray(result['category_widget']['reject'])).toBeTruthy();
    });

    it('should not generate any value when internal collection is empty', function() {
      var result = this.filter.toJSON();
      expect(result['category_widget']).toBeDefined();
      expect(result['category_widget']['reject']).not.toBeDefined();
      expect(result['category_widget']['accept']).not.toBeDefined();
    });
  });

});
