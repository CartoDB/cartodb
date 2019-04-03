var RangeFilter = require('../../../../src/windshaft/filters/range');

describe('windshaft/filters/range', function () {
  beforeEach(function () {
    this.dataviewId = 'range-filter-uuid';
    this.filter = new RangeFilter({
      dataviewId: this.dataviewId
    });
  });

  it('should have a undefined range values by default', function () {
    expect(this.filter.get('min')).toBeUndefined();
    expect(this.filter.get('max')).toBeUndefined();
  });

  describe('.setRange', function () {
    it('should set the range', function () {
      this.filter.setRange(2, 4);
      expect(this.filter.get('min')).toEqual(2);
      expect(this.filter.get('max')).toEqual(4);
    });
  });

  describe('.isEmpty', function () {
    it('should return true if there are no range values set', function () {
      expect(this.filter.isEmpty()).toBe(true);
      this.filter.setRange(1, 2);
      expect(this.filter.isEmpty()).toBe(false);
    });
  });

  describe('.unsetRange', function () {
    beforeEach(function () {
      this.filter.setRange(2, 4);
      this.changeSpy = jasmine.createSpy('change');
      this.filter.bind('change', this.changeSpy);
      this.filter.unsetRange();
    });

    it('should remove range', function () {
      expect(this.filter.get('min')).toBeUndefined();
      expect(this.filter.get('max')).toBeUndefined();
    });

    it('should only trigger change event once', function () {
      expect(this.changeSpy).toHaveBeenCalled();
      expect(this.changeSpy.calls.count()).toEqual(1);
    });
  });

  describe('.toJSON', function () {
    beforeEach(function () {
      this.filter.setRange(2, 4);
      this.res = this.filter.toJSON();
    });

    it('should return a JSON object', function () {
      expect(this.res).toEqual(jasmine.any(Object));
      var res = this.res[this.dataviewId];
      expect(res).toEqual(jasmine.any(Object));
      expect(res.min).toEqual(2);
      expect(res.max).toEqual(4);
    });
  });
});
