var ConfigModel = require('../../../../javascripts/cartodb3/data/config-model');
var TableModel = require('../../../../javascripts/cartodb3/data/table-model');
var UserModel = require('../../../../javascripts/cartodb3/data/user-model');

describe('data/table-model', function () {
  beforeEach(function () {
    this.configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.userModel = new UserModel({}, {
      configModel: this.configModel
    });
    this.model = new TableModel({
      id: 'abc-123',
      name: 'foobar_table'
    }, {
      parse: true,
      configModel: this.configModel
    });
  });

  it('should have a custom URL to get data', function () {
    expect(this.model.url()).toEqual('/u/pepe/api/v1/tables/foobar_table');
  });

  it('should return read only', function () {
    expect(this.model.isReadOnly()).toBe(true);
  });

  it('should provide means for a custom URL for columns collection', function () {
    expect(this.model.columnsCollection.url()).toEqual('/u/pepe/api/v1/tables/foobar_table/columns');
  });

  describe('getGeometryType', function () {
    it('should return the geometries those are present in the table', function () {
      this.model.set('geometry_types', ['ST_MULTIPOINT']);
      expect(this.model.getGeometryType()).toEqual(['point']);
      this.model.set('geometry_types', ['ST_POINT']);
      expect(this.model.getGeometryType()).toEqual(['point']);
      this.model.set('geometry_types', ['ST_MULTIPOLYGON']);
      expect(this.model.getGeometryType()).toEqual(['polygon']);
      this.model.set('geometry_types', ['ST_POLYGON']);
      expect(this.model.getGeometryType()).toEqual(['polygon']);
      this.model.set('geometry_types', ['ST_LINESTRING']);
      expect(this.model.getGeometryType()).toEqual(['line']);
      this.model.set('geometry_types', ['ST_MULTILINESTRING']);
      expect(this.model.getGeometryType()).toEqual(['line']);
    });

    it('shouldn\'t return the same geometry several times', function () {
      this.model.set('geometry_types', ['ST_MULTIPOINT', 'ST_POINT', 'ST_POLYGON']);
      expect(this.model.getGeometryType()).toEqual(['point', 'polygon']);
    });
  });

  describe('if sync data is provided', function () {
    var syncTableModel;

    it('should create synchronization model ', function () {
      syncTableModel = new TableModel({
        id: 'harrr',
        name: 'another_table',
        synchronization: {}
      }, {
        parse: true,
        configModel: this.configModel
      });
      expect(syncTableModel._syncModel).toBeDefined();
      expect(syncTableModel.attributes.synchronization).toBeDefined();
    });

    it('should return read only', function () {
      expect(syncTableModel.isReadOnly(this.userModel)).toBe(true);
    });
  });

  describe('if permission data is provided', function () {
    var permissionTableModel;

    beforeEach(function () {
      permissionTableModel = new TableModel({
        id: 'harrr',
        name: 'another_table',
        permission: {}
      }, {
        parse: true,
        configModel: this.configModel
      });
    });

    it('should create permission model', function () {
      expect(permissionTableModel._permissionModel).toBeDefined();
      expect(permissionTableModel.attributes.permission).toBeDefined();
    });

    describe('if has write access', function () {
      beforeEach(function () {
        spyOn(permissionTableModel._permissionModel, 'hasWriteAccess').and.returnValue(true);
      });

      it('should not return read only', function () {
        expect(permissionTableModel.isReadOnly(this.userModel)).toBe(false);
      });
    });
  });
});
