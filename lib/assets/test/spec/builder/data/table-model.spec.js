var _ = require('underscore');
var ConfigModel = require('builder/data/config-model');
var TableModel = require('builder/data/table-model');
var PermissionModel = require('builder/data/permission-model');
var UserModel = require('builder/data/user-model');

describe('data/table-model', function () {
  var configModel;

  beforeEach(function () {
    configModel = new ConfigModel({
      base_url: '/u/pepe'
    });
    this.userModel = new UserModel({
      username: 'pericooo'
    }, {
      configModel: configModel
    });
    this.model = new TableModel({
      id: 'abc-123',
      name: 'foobar_table'
    }, {
      parse: true,
      configModel: configModel
    });
  });

  it('should have a custom URL to get data', function () {
    expect(this.model.url()).toEqual('/u/pepe/api/v1/tables/foobar_table');
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

  describe('.parse', function () {
    it('should take table_visualization attributes from response if they exist, not removing or overwritting geometry_types', function () {
      var parseAttrs = this.model.parse({
        id: 'bad',
        geometry_types: ['ST_POLYGON'],
        table_visualization: {
          id: 'good',
          geometry_types: ['pepito']
        }
      });

      expect(parseAttrs.id).toBe('good');
      expect(parseAttrs.geometry_types).toEqual(['ST_POLYGON']);

      parseAttrs = this.model.parse({
        id: 'new_good',
        geometry_types: ['ST_POINT'],
        table_visualization: {}
      });

      expect(parseAttrs.id).toBe('new_good');
      expect(parseAttrs.geometry_types).toEqual(['ST_POINT']);
    });

    describe('synchronization', function () {
      it('should create synchronization model if sync data is provided and model is not created', function () {
        var syncTableModel = createTableModel({ synchronization: {} }, true);
        expect(syncTableModel._syncModel).toBeDefined();
        expect(syncTableModel.attributes.synchronization).toBeDefined();
      });

      it('should update synchronization model if sync data is provided and that model is already created', function () {
        var syncTableModel = createTableModel({ synchronization: {} }, true);
        expect(syncTableModel._syncModel.get('id')).toBeUndefined();
        syncTableModel.parse({ synchronization: { id: '3' } });
        expect(syncTableModel._syncModel.get('id')).toBe('3');
      });
    });

    describe('permission', function () {
      it('should create permission model if permission attribute is provided', function () {
        var permissionTableModel = createTableModel({ permission: {} }, true);
        expect(permissionTableModel._permissionModel).toBeDefined();
        expect(permissionTableModel.attributes.permission).toBeDefined();
      });

      it('should update permission model if permission attribute is provided and that model is already created', function () {
        var permissionTableModel = createTableModel({ permission: {} }, true);
        expect(permissionTableModel._permissionModel.get('id')).toBeUndefined();
        permissionTableModel.parse({ permission: { id: 'perm' } });
        expect(permissionTableModel._permissionModel.get('id')).toBe('perm');
      });
    });
  });

  describe('.isSync', function () {
    it('should be truthy if there is a synchronization model and it has id', function () {
      var syncTableModel = createTableModel({ synchronization: { id: 'ha' } }, true);
      expect(syncTableModel.isSync()).toBeTruthy();
    });

    it('should be falsy if there isn\'t a synchronization model or if it doesn\'t have an id', function () {
      var nonSyncTableModel = createTableModel({ synchronization: {} }, true);
      expect(nonSyncTableModel.isSync()).toBeFalsy();
      var nonSyncTableModel2 = createTableModel({}, true);
      expect(nonSyncTableModel2.isSync()).toBeFalsy();
    });
  });

  describe('getOwnerName', function () {
    it('should take the owner name from the table name if it is included', function () {
      this.model.set('name', 'perico.foobar_table');
      expect(this.model.getOwnerName()).toBe('perico');
    });

    it('should take the owner name from the permission if it is available and it is not included in the table name', function () {
      this.model._permissionModel = new PermissionModel({}, {
        configModel: configModel,
        _userModel: this.userModel
      });
      this.model.set('name', 'foobar_table');
      expect(this.model.getOwnerName()).toBe('pericooo');
    });
  });

  describe('.hasWriteAccess', function () {
    beforeEach(function () {
      this.model._permissionModel = new PermissionModel({}, {
        configModel: configModel
      });
      this.permModel = this.model._permissionModel;
      spyOn(this.permModel, 'hasWriteAccess');
    });

    it('should have write access if userModel has that permission', function () {
      this.permModel.hasWriteAccess.and.returnValue(true);
      expect(this.model.hasWriteAccess(this.userModel)).toBeTruthy();
    });

    it('should not have write access if userModel doesn\'t have that permission', function () {
      this.permModel.hasWriteAccess.and.returnValue(false);
      expect(this.model.hasWriteAccess(this.userModel)).toBeFalsy();
    });

    it('should not have write access if userModel is not defined', function () {
      expect(this.model.hasWriteAccess()).toBeFalsy();
    });
  });

  describe('.isReadOnly', function () {
    it('should be true if it is synced', function () {
      var syncTableModel = createTableModel({ synchronization: {} }, true);
      expect(syncTableModel.isReadOnly(this.userModel)).toBe(true);
    });

    it('should be true if user doesn\'t have write permissions', function () {
      var permissionTableModel = createTableModel({ permission: {} }, true);
      spyOn(permissionTableModel, 'hasWriteAccess').and.returnValue(false);
      expect(permissionTableModel.isReadOnly(this.userModel)).toBe(true);
    });

    it('should be false if user does have write permissions', function () {
      var permissionTableModel = createTableModel({ permission: {} }, true);
      spyOn(permissionTableModel, 'hasWriteAccess').and.returnValue(true);
      expect(permissionTableModel.isReadOnly(this.userModel)).toBe(false);
    });
  });

  function createTableModel (attrs, parseModel) {
    return new TableModel(
      _.extend(
        {
          id: 'har',
          name: 'table'
        },
        attrs || {}
      ),
      {
        parse: parseModel,
        configModel: configModel
      }
    );
  }
});
