var helper = require('../../../../src/dataviews/helpers/histogram-helper');

describe('dataviews/helpers/histogram-helper', function () {
  describe('isShorterThan', function () {
    it('should respond to the time (hierarchy', function () {
      expect(helper.isShorterThan('year', 'quarter')).toBe(true);
      expect(helper.isShorterThan('quarter', 'month')).toBe(true);
      expect(helper.isShorterThan('month', 'week')).toBe(true);
      expect(helper.isShorterThan('week', 'day')).toBe(true);
      expect(helper.isShorterThan('day', 'hour')).toBe(true);
      expect(helper.isShorterThan('hour', 'minute')).toBe(true);
      expect(helper.isShorterThan('superman', 'batman')).toBe(false);
    });
  });

  describe('calculateLimits', function () {
    it('should return the limits of the bins', function () {
      var bins = [
        {min: 2, max: 5679},
        {min: 312, max: 345},
        {min: -34, max: 82}
      ];

      var limits = helper.calculateLimits(bins);

      expect(limits.start).toBe(-34);
      expect(limits.end).toBe(5679);
    });

    it('should return null if there are no limits', function () {
      var bins = [{ property: 'value' }, {}];

      var limits = helper.calculateLimits(bins);

      expect(limits.start).toBe(null);
      expect(limits.end).toBe(null);
    });
  });
});
