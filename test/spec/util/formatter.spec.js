var formatter = require('../../../src/util/formatter');

describe('src/util/formatter', function () {
  it('should format numbers', function () {
    expect(formatter.formatNumber(0)).toBe(0);
    expect(formatter.formatNumber(0.071)).toBe('0.07');
    expect(formatter.formatNumber(0.71)).toBe('0.71');
    expect(formatter.formatNumber(-0.71)).toBe('-0.71');
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

  it('should format strings', function () {
    expect(formatter.formatNumber('0')).toBe('0');
    expect(formatter.formatNumber('0.071')).toBe('0.07');
    expect(formatter.formatNumber('0.71')).toBe('0.71');
    expect(formatter.formatNumber('-0.71')).toBe('-0.71');
    expect(formatter.formatNumber('5')).toBe('5');
    expect(formatter.formatNumber('5.0')).toBe('5');
    expect(formatter.formatNumber('5.00')).toBe('5');
    expect(formatter.formatNumber('5.71')).toBe('5.71');
    expect(formatter.formatNumber('-5.71')).toBe('-5.71');
    expect(formatter.formatNumber('186.7')).toBe('187');
    expect(formatter.formatNumber('96.7')).toBe('96.7');
    expect(formatter.formatNumber('500')).toBe('500');
    expect(formatter.formatNumber('1234')).toBe('1.2k');
  });

  it('should format exponentials', function () {
    expect(formatter.formatNumber(0.0001)).toBe('1.0<span class="Legend-exponential">x</span>10<sup class="Legend-exponential">-4</sup>');
    expect(formatter.formatNumber(0.001)).toBe('1.0<span class="Legend-exponential">x</span>10<sup class="Legend-exponential">-3</sup>');
    expect(formatter.formatNumber(0.0071)).toBe('7.1<span class="Legend-exponential">x</span>10<sup class="Legend-exponential">-3</sup>');
    expect(formatter.formatNumber(7.1e-5)).toBe('7.1<span class="Legend-exponential">x</span>10<sup class="Legend-exponential">-5</sup>');
  });

  it('shouldn\'t format non numbers', function () {
    expect(formatter.formatNumber(null)).toBe(null);
    expect(formatter.formatNumber('I am not a number')).toBe('I am not a number');
  });

  it('should format dates', function () {
    expect(formatter.formatDate(new Date(2017, 0))).toBe('2017-01-01');
    expect(formatter.formatDate(new Date(2017, 0, 4))).toBe('2017-01-04');
    expect(formatter.formatDate(new Date(2017, 1, 4, 17))).toBe('2017-02-04');
    expect(formatter.formatDate(new Date(2017, 2, 4, 17, 24))).toBe('2017-03-04');
    expect(formatter.formatDate(new Date(2017, 3, 4, 17, 24, 58))).toBe('2017-04-04');
    expect(formatter.formatDate(new Date(2017, 4, 4, 17, 24, 58, 789))).toBe('2017-05-04');
  });
});
