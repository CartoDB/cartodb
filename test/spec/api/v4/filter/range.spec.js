const carto = require('../../../../../src/api/v4/index');

describe('api/v4/filter/sql/range', function () {
  describe('constructor', function () {
    it('should throw a descriptive error when an unknown filter has been passed', function () {
      expect(function () {
        new carto.filter.Range('fake_column', { unknown_filter: '' }); // eslint-disable-line
      }).toThrowError("'unknown_filter' is not a valid filter. Please check documentation.");
    });
  });

  describe('SQL Templates', function () {
    it('LT', function () {
      const categoryFilter = new carto.filter.Range('fake_column', { lt: 10 });
      expect(categoryFilter.getSQL()).toBe('fake_column < 10');
    });

    it('LTE', function () {
      const categoryFilter = new carto.filter.Range('fake_column', { lte: 10 });
      expect(categoryFilter.getSQL()).toBe('fake_column <= 10');
    });

    it('GT', function () {
      const categoryFilter = new carto.filter.Range('fake_column', { gt: 10 });
      expect(categoryFilter.getSQL()).toBe('fake_column > 10');
    });

    it('GTE', function () {
      const categoryFilter = new carto.filter.Range('fake_column', { gte: 10 });
      expect(categoryFilter.getSQL()).toBe('fake_column >= 10');
    });

    it('BETWEEN', function () {
      const categoryFilter = new carto.filter.Range('fake_column', { between: { min: 1, max: 10 } });
      expect(categoryFilter.getSQL()).toBe('fake_column BETWEEN 1 AND 10');
    });

    it('NOT BETWEEN', function () {
      const categoryFilter = new carto.filter.Range('fake_column', { notBetween: { min: 1, max: 10 } });
      expect(categoryFilter.getSQL()).toBe('fake_column NOT BETWEEN 1 AND 10');
    });

    it('BETWEEN SYMMETRIC', function () {
      const categoryFilter = new carto.filter.Range('fake_column', { betweenSymmetric: { min: 1, max: 10 } });
      expect(categoryFilter.getSQL()).toBe('fake_column BETWEEN SYMMETRIC 1 AND 10');
    });

    it('NOT BETWEEN SYMMETRIC', function () {
      const categoryFilter = new carto.filter.Range('fake_column', { notBetweenSymmetric: { min: 1, max: 10 } });
      expect(categoryFilter.getSQL()).toBe('fake_column NOT BETWEEN SYMMETRIC 1 AND 10');
    });
  });
});
