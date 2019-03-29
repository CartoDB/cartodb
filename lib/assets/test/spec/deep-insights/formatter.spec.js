var formatter = require('../../../javascripts/deep-insights/formatter');

describe('formatter', function () {
  var timestamp = 1494066976; // 2017-05-06 10:36:16

  it('should format numbers', function () {
    expect(formatter.formatNumber(0)).toBe(0);
    expect(formatter.formatNumber(0.001)).toBe('0.00100');
    expect(formatter.formatNumber(0.071)).toBe('0.0710');
    expect(formatter.formatNumber(0.71)).toBe('0.710');
    expect(formatter.formatNumber(-0.71)).toBe('-0.710');
    expect(formatter.formatNumber(5)).toBe('5');
    expect(formatter.formatNumber(5.0)).toBe('5');
    expect(formatter.formatNumber(5.00)).toBe('5');
    expect(formatter.formatNumber(5.71)).toBe('5.71');
    expect(formatter.formatNumber(-5.71)).toBe('-5.71');
    expect(formatter.formatNumber(186.7)).toBe('187');
    expect(formatter.formatNumber(96.7)).toBe('96.7');
    expect(formatter.formatNumber(500)).toBe('500');
    expect(formatter.formatNumber(1234)).toBe('1.2k');
  });

  it('shouldn\'t format non numbers', function () {
    expect(formatter.formatNumber(null)).toBe(null);
    expect(formatter.formatNumber('I am not a number')).toBe('I am not a number');
  });

  it('should format timestamps correctly', function () {
    expect(formatter.timestampFactory('decade', 0)(timestamp)).toEqual('2017');
    expect(formatter.timestampFactory('year', 0)(timestamp)).toEqual('2017');
    expect(formatter.timestampFactory('quarter', 0)(timestamp)).toEqual('Q2 2017');
    expect(formatter.timestampFactory('month', 0)(timestamp)).toEqual('May 2017');
    expect(formatter.timestampFactory('week', 0)(timestamp)).toEqual('May 6th, 2017');
    expect(formatter.timestampFactory('day', 0)(timestamp)).toEqual('May 6th, 2017');
    expect(formatter.timestampFactory('hour', 0)(timestamp)).toEqual('10:00 - May 6th, 2017');
    expect(formatter.timestampFactory('minute', 0)(timestamp)).toEqual('10:36 - May 6th, 2017');
  });

  it('should format timestamps correctly with offset', function () {
    function hoursToSeconds (hours) {
      return hours * 3600;
    }
    expect(formatter.timestampFactory('day', hoursToSeconds(-14))(timestamp)).toEqual('May 5th, 2017');
    expect(formatter.timestampFactory('hour', hoursToSeconds(12))(timestamp)).toEqual('22:00 - May 6th, 2017');
    expect(formatter.timestampFactory('minute', hoursToSeconds(-5))(timestamp)).toEqual('05:36 - May 6th, 2017');
  });
});
