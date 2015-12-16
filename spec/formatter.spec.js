var formatter = require('app/formatter');

describe('formatter', function () {
  it('should format numbers', function () {
    expect(formatter.formatNumber(0)).toBe('0');
    expect(formatter.formatNumber(5)).toBe('5');
    expect(formatter.formatNumber(5.0)).toBe('5');
    expect(formatter.formatNumber(5.00)).toBe('5');
    expect(formatter.formatNumber(186.7)).toBe('186.70');
    expect(formatter.formatNumber(500)).toBe('500');
    expect(formatter.formatNumber(1234)).toBe('1.2k');
  });
});
