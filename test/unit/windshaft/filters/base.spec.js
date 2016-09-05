var FilterBase = require('../../../../src/windshaft/filters/base');

describe('windshaft/filters/base', function () {
  beforeEach(function () {
    this.filter = new FilterBase();
    this.filter.toJSON = jasmine.createSpy('toJSON').and.returnValue({});
    this.filter.isEmpty = jasmine.createSpy('isEmpty').and.returnValue(false);
  });

  describe('.remove', function () {
    beforeEach(function () {
      this.removeSpy = jasmine.createSpy('remove');
      this.filter.on('destroy', this.removeSpy);
      spyOn(this.filter, 'stopListening');
      this.filter.remove();
    });

    it('should trigger a destroy event', function () {
      expect(this.removeSpy).toHaveBeenCalledWith(this.filter);
    });

    it('should stop listening to events', function () {
      expect(this.filter.stopListening).toHaveBeenCalled();
    });
  });
});
