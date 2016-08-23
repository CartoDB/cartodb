var SQLUtil = require('../../../../javascripts/cartodb3/helpers/sql-utils');
var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');
var TableModel = require('../../../../javascripts/cartodb3/data/table-model');

describe('helpers/sql-utils', function () {
  describe('prependTableName', function () {
    var configModel;
    var tableModel;
    var userModel;

    beforeEach(function () {
      configModel = new ConfigModel({
        base_url: '/u/pepe',
        user_name: 'pepe'
      });

      userModel = new UserModel({
        username: 'pepe',
        actions: {
          private_tables: true
        }
      }, {
        configModel: configModel
      });

      tableModel = new TableModel({
        name: 'paradas_metro_madrid'
      }, {
        configModel: configModel
      });

      var permission = {
        owner: {
          username: 'pepe'
        }
      };

      tableModel.set('permission', permission);
    });

    it('owner', function () {
      spyOn(tableModel, 'isOwner').and.returnValue(true);

      expect(SQLUtil.prependTableName('SELECT * FROM paradas_metro_madrid', tableModel, userModel)).toBe('SELECT * FROM paradas_metro_madrid');
      expect(SQLUtil.prependTableName('SELECT * FROM pepe.paradas_metro_madrid', tableModel, userModel)).toBe('SELECT * FROM pepe.paradas_metro_madrid');
      expect(SQLUtil.prependTableName('SELECT * FROM foo_paradas_metro_madrid', tableModel, userModel)).toBe('SELECT * FROM foo_paradas_metro_madrid');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM paradas_metro_madrid,table2 WHERE X=Y', tableModel, userModel)).toBe('SELECT one, two, three FROM paradas_metro_madrid,table2 WHERE X=Y');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM pepe.paradas_metro_madrid,table2 WHERE X=Y', tableModel, userModel)).toBe('SELECT one, two, three FROM pepe.paradas_metro_madrid,table2 WHERE X=Y');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM table2,pepe.paradas_metro_madrid WHERE X=Y', tableModel, userModel)).toBe('SELECT one, two, three FROM table2,pepe.paradas_metro_madrid WHERE X=Y');
    });

    it('shared', function () {
      spyOn(tableModel, 'isOwner').and.returnValue(false);

      expect(SQLUtil.prependTableName('SELECT * FROM paradas_metro_madrid', tableModel, userModel)).toBe('SELECT * FROM pepe.paradas_metro_madrid');
      expect(SQLUtil.prependTableName('SELECT * FROM pepe.paradas_metro_madrid', tableModel, userModel)).toBe('SELECT * FROM pepe.paradas_metro_madrid');
      expect(SQLUtil.prependTableName('SELECT * FROM foo_paradas_metro_madrid', tableModel, userModel)).toBe('SELECT * FROM foo_paradas_metro_madrid');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM paradas_metro_madrid,table2 WHERE X=Y', tableModel, userModel)).toBe('SELECT one, two, three FROM pepe.paradas_metro_madrid,table2 WHERE X=Y');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM table2,paradas_metro_madrid WHERE X=Y', tableModel, userModel)).toBe('SELECT one, two, three FROM table2,pepe.paradas_metro_madrid WHERE X=Y');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM pepe.paradas_metro_madrid,table2 WHERE X=Y', tableModel, userModel)).toBe('SELECT one, two, three FROM pepe.paradas_metro_madrid,table2 WHERE X=Y');
      expect(SQLUtil.prependTableName('SELECT one, two, three FROM table2,pepe.paradas_metro_madrid WHERE X=Y', tableModel, userModel)).toBe('SELECT one, two, three FROM table2,pepe.paradas_metro_madrid WHERE X=Y');
    });
  });
});
