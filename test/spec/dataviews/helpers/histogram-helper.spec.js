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
});
