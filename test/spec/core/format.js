var formatter = require('cdb/core/format');

describe('cdb/core/format', function() {

  beforeEach(function() {
    this.formatter = formatter;
  });

  it('should format numbers', function() {
    expect(this.formatter.formatNumber(0)).toBe('0');
    expect(this.formatter.formatNumber(5)).toBe("5");
    expect(this.formatter.formatNumber(5.0)).toBe("5");
    expect(this.formatter.formatNumber(5.00)).toBe("5");
    expect(this.formatter.formatNumber(186.7)).toBe("186.70");
    expect(this.formatter.formatNumber(500)).toBe("500");
    expect(this.formatter.formatNumber(1234)).toBe("1.2k");
  });

});
