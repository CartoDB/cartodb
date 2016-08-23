var SQLUtil = require('../../../../javascripts/cartodb3/helpers/sql-utils');

describe('helpers/sql-utils', function () {
  describe('prependTableName', function () {
    it('shoud prepend username properly', function () {
      expect(SQLUtil.prependTableName('SELECT * FROM paradas_metro_madrid', 'paradas_metro_madrid', 'pepe')).toBe('SELECT * FROM pepe.paradas_metro_madrid');
      expect(SQLUtil.prependTableName('SELECT * FROM pepe.paradas_metro_madrid', 'paradas_metro_madrid', 'pepe')).toBe('SELECT * FROM pepe.paradas_metro_madrid');
      expect(SQLUtil.prependTableName('SELECT * FROM foo_paradas_metro_madrid', 'paradas_metro_madrid', 'pepe')).toBe('SELECT * FROM foo_paradas_metro_madrid');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM paradas_metro_madrid,table2 WHERE X=Y', 'paradas_metro_madrid', 'pepe')).toBe('SELECT one, two, three FROM pepe.paradas_metro_madrid,table2 WHERE X=Y');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM table2,paradas_metro_madrid WHERE X=Y', 'paradas_metro_madrid', 'pepe')).toBe('SELECT one, two, three FROM table2,pepe.paradas_metro_madrid WHERE X=Y');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM pepe.paradas_metro_madrid,table2 WHERE X=Y', 'paradas_metro_madrid', 'pepe')).toBe('SELECT one, two, three FROM pepe.paradas_metro_madrid,table2 WHERE X=Y');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM table2,pepe.paradas_metro_madrid WHERE X=Y', 'paradas_metro_madrid', 'pepe')).toBe('SELECT one, two, three FROM table2,pepe.paradas_metro_madrid WHERE X=Y');
    });
  });
});
