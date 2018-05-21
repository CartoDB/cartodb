const _ = require('underscore');

const CartoTableMetadata = require('dashboard/views/public-dataset/carto-table-metadata');
const ImportModel = require('dashboard/data/import-model');
const RowModel = require('dashboard/data/table/row-model');
const SQLViewDataModel = require('dashboard/data/table/sqlviewdata-model');
const CartoTableMetadataFixture = require('fixtures/dashboard/carto-table-metadata.fixture');
const configModel = require('fixtures/dashboard/config-model.fixture');
const InfowindowModel = require('builder/data/infowindow-definition-model');
const SQL = require('internal-carto.js').SQL;

describe('dashboard/views/public-dataset/carto-table-metadata', function () {
  let table;

  beforeEach(function () {
    table = new CartoTableMetadata({
      id: 'testTable',
      name: 'testTable',
      schema: [
        ['test', 'string'],
        ['test2', 'number']
      ]
    }, { configModel });
  });

  it('should return columntypes', function () {
    expect(table.columnTypes()).toEqual({
      test: 'string',
      test2: 'number'
    });
  });

  it('should return unqualified name', function () {
    const ntable = new CartoTableMetadata({
      id: '"kease".testTable',
      name: '"kease".testTable'
    }, { configModel });
    expect(ntable.getUnqualifiedName()).toEqual('testTable');
    expect(table.getUnqualifiedName()).toEqual('testTable');
  });

  it('should add geometrytypes when adding a row', function () {
    table = new CartoTableMetadata({
      name: 'testTable',
      schema: [
        ['test', 'string'],
        ['test2', 'number']
      ],
      geometry_types: []
    }, { configModel });
    table.data().add({ cartodb_id: 2 });
    var r = table.data().get(2);
    r.set('the_geom', '{"type": "point", "coordinates": [1,2]}');
    expect(table.get('geometry_types')).toEqual(['st_point']);
  });

  it('geometryTypeChanged', function () {
    var changed = null;
    table.bind('change', function () {
      changed = table.geometryTypeChanged();
    });

    table.set('geometry_types', ['ST_Point']);
    expect(changed).toEqual(true);
    changed = null;
    table.set('geometry_types', ['ST_Point']);
    expect(changed).toEqual(null);
    changed = null;
    table.set('geometry_types', ['ST_MultiPoint']);
    expect(changed).toEqual(false);
    changed = null;
    table.set('geometry_types', ['ST_Polygon']);
    expect(changed).toEqual(true);
    changed = null;
    table.unset('geometry_types');
    expect(changed).toEqual(true);
  });

  it("should be read only if it's synced", function () {
    expect(table.isReadOnly()).toEqual(false);
    table.synchronization.set('id', 'test');
    expect(table.isReadOnly()).toEqual(true);
  });

  it('should emit sync changes', function () {
    var spy = jasmine.createSpy();
    table.on('change:isSync', spy);
    table.synchronization.set('id', 'test');
    expect(spy).toHaveBeenCalledWith(table, true);
    table.synchronization.unset('id');
    expect(spy).toHaveBeenCalledWith(table, false);
  });

  it('should create column types', function () {
    expect(table._getColumn('test').get('type')).toEqual('string');
    expect(table._getColumn('test2').get('type')).toEqual('number');
    table.set({
      schema: [
        ['test', 'number'],
        ['test2', 'number']
      ]
    });
    expect(table._getColumn('test').get('type')).toEqual('number');
  });

  it('should sort schema', function () {
    table = new CartoTableMetadata({
      name: 'testTable',
      schema: [
        ['otra_foobar', 'string'],
        ['test2', 'number'],
        ['_desc', 'string'],
        ['other', 'string'],
        ['the_geom', 'geometry'],
        ['created_at', 'date'],
        ['updated_at', 'date'],
        ['cartodb_id', 'number']
      ]
    }, { configModel });
    var changeSchemaSpy = jasmine.createSpy();
    table.bind('change:schema', changeSchemaSpy);
    table.sortSchema();

    expect(table.get('schema')).toEqual([
      ['cartodb_id', 'number'],
      ['the_geom', 'geometry'],
      ['_desc', 'string'],
      ['other', 'string'],
      ['otra_foobar', 'string'],
      ['test2', 'number'],
      ['created_at', 'date'],
      ['updated_at', 'date']
    ]
    );

    expect(changeSchemaSpy).toHaveBeenCalled();
  });

  it('should copy the types of the original schema', function () {
    var sqlView = new SQLViewDataModel(null, { sql: 'select * from a', configModel });

    table.useSQLView(sqlView);
    sqlView.query_schema = {
      'test': 'string',
      'test3': 'number'
    };
    sqlView.reset([
      { test: 1, b: 2 }
    ]);

    expect(table.getColumnType('test')).toEqual('string');
    expect(table.getColumnType('test2')).toEqual(undefined);
    expect(table.getColumnType('test3')).toEqual('number');

    table.useSQLView(null);

    expect(table.getColumnType('test')).toEqual('string');
    expect(table.getColumnType('test3')).toEqual(undefined);
    expect(table.getColumnType('b')).toEqual(undefined);
  });

  it('should have a original_schema', function () {
    var s = _.clone(table.get('schema'));
    expect(table.get('original_schema')).toEqual(s);
    var sqlView = new SQLViewDataModel(null, { sql: 'select * from a', configModel });
    table.useSQLView(sqlView);
    sqlView.reset([
      { a: 1, b: 2 }
    ]);
    expect(table.get('original_schema')).toEqual(s);
    expect(table.get('schema')).not.toEqual(s);
  });

  it('should return geom column types', function () {
    table.set({geometry_types: ['ST_MultiPolygon']});
    expect(table.geomColumnTypes()).toEqual(['polygon']);
    table.set({geometry_types: ['ST_MultiPolygon', 'ST_LineString']});
    expect(table.geomColumnTypes()).toEqual(['polygon', 'line']);
    table.set({geometry_types: ['ST_MultiPoint', 'ST_LineString']});
    expect(table.geomColumnTypes()).toEqual(['point', 'line']);
    table.set({geometry_types: []});
    expect(table.geomColumnTypes()).toEqual([]);
    table.set({geometry_types: ['st_MultiPoint', 'ST_LINESTRING']});
    expect(table.geomColumnTypes()).toEqual(['point', 'line']);
    expect(table.geomColumnTypes('test')).toEqual([]);
    table.set({geometry_types: ''});
    expect(table.geomColumnTypes()).toEqual([]);
  });

  it('should return stats geom column types', function () {
    table.set({ stats_geometry_types: ['ST_MultiPolygon'] });
    expect(table.statsGeomColumnTypes()).toEqual(['polygon']);
  });

  it('hasgeomtype', function () {
    var r = new RowModel({
      cartodb_id: 100,
      the_geom: JSON.stringify({ type: 'point', coordinates: [2, 1] })
    }, { configModel });
    expect(r.hasGeometry()).toEqual(true);
    r.set('the_geom', null);
    expect(r.hasGeometry()).toEqual(false);
    r.set('the_geom', undefined);
    expect(r.hasGeometry()).toEqual(false);
  });

  it('should know if the_geom contains a geoJSON', function () {
    var a = {
      cartodb_id: 100,
      the_geom: JSON.stringify({ type: 'point', coordinates: [2, 1] })
    };
    var r = new RowModel(a, { configModel });
    expect(r.isGeometryGeoJSON()).toBeTruthy();
    a.the_geom = 'asdasdsad';
    r = new RowModel(a, { configModel });
    expect(r.isGeometryGeoJSON()).toBeFalsy();
  });

  it('tojson should not include the_geom if is not in geojson format', function () {
    var a = {
      cartodb_id: 100,
      the_geom: JSON.stringify({ type: 'point', coordinates: [2, 1] })
    };
    var r = new RowModel(a, { configModel });
    expect(r.toJSON().the_geom).toEqual(a.the_geom);
    a.the_geom = 'asdasdsad';
    r = new RowModel(a, { configModel });
    expect(r.toJSON().the_geom).toEqual(undefined);
  });

  it('tojson should not include the_geom_webmercator, created_at or updated_at', function () {
    var a = {
      cartodb_id: 100,
      updated_at: 1,
      created_at: 1,
      the_geom_webmercator: 1
    };
    var r = new RowModel(a, { configModel });
    expect(r.toJSON().the_geom).toEqual(undefined);
    expect(r.toJSON().created_at).toEqual(undefined);
    expect(r.toJSON().updated_at).toEqual(undefined);
  });

  it('altertable', function () {
    var t = CartoTableMetadata;

    expect(t.alterTable('select * from blba')).toEqual(false);
    expect(t.alterTable('select create from table')).toEqual(false);
    expect(t.alterTable('select * from test wherw id=\'vacuum\'')).toEqual(false);

    expect(t.alterTable('insert into blaba values (1,2,3,4)')).toEqual(false);
    expect(t.alterTable('delete from bkna')).toEqual(false);
    expect(t.alterTable('update aaa set a = 1')).toEqual(false);

    expect(t.alterTable('vacuum full')).toEqual(true);
    expect(t.alterTable('exPlain     Analyze select * from test')).toEqual(true);
    expect(t.alterTable('grant update on foo to jerry')).toEqual(true);
    expect(t.alterTable('comment on foo \'this is crazy\'')).toEqual(true);
    expect(t.alterTable('revoke update on foo from jerry')).toEqual(true);
    expect(t.alterTable('reindex public.foo')).toEqual(true);
    expect(t.alterTable('cluster public.foo using foo_gidx')).toEqual(true);

    expect(t.alterTable('alter table add column blbla')).toEqual(true);
    expect(t.alterTable('alter schema.table add column blbla')).toEqual(true);

    expect(t.alterTable('create function')).toEqual(true);
    expect(t.alterTable('create or replace function')).toEqual(true);
    expect(t.alterTable('create index foo_idx on foo using gist(the_geom)')).toEqual(true);
    expect(t.alterTable('create index foo_idx on public.foo (cartodb_id)')).toEqual(true);
  });

  it('altertabledata', function () {
    var t = CartoTableMetadata;
    expect(t.alterTableData('select * from blba')).toEqual(false);

    expect(t.alterTableData('alter table add column blbla')).toEqual(true);
    expect(t.alterTableData('vacuum full')).toEqual(true);

    expect(t.alterTableData('refresh materialized view bar')).toEqual(true);
    expect(t.alterTableData('truncate table')).toEqual(true);
    expect(t.alterTableData('truncate schema.table')).toEqual(true);
    expect(t.alterTableData('update aaa set a = 1')).toEqual(true);
    expect(t.alterTableData('update table as whatvever set a = null')).toEqual(true);
    expect(t.alterTableData('update  __rabos123123     set a = 1')).toEqual(true);
    expect(t.alterTableData('insert into blaba values (1,2,3,4)')).toEqual(true);
    expect(t.alterTableData('insert    into blaba values (1,2,3,4)')).toEqual(true);
    expect(t.alterTableData('delete from bkna')).toEqual(true);
    expect(t.alterTableData('update  schema.table  set a = 1')).toEqual(true);
    expect(t.alterTableData('update  "schema".table  set a = 1')).toEqual(true);
    expect(t.alterTableData('update  "schema"."table"  set a = 1')).toEqual(true);
    expect(t.alterTableData('update  "schema-dash".table  set a = 1')).toEqual(true);
    expect(t.alterTableData('update  "schema-dash"."table"  set a = 1')).toEqual(true);
  });

  it("isGeoreferenced should be false when there's geom and no data", function () {
    // var r = new RowModel({
    //   cartodb_id: 100,
    //   the_geom: JSON.stringify({ type: 'point', coordinates: [2, 1] })
    // });
    table = CartoTableMetadataFixture({
      name: 'test',
      schema: [['the_geom', 'geometry']],
      geometry_types: []
    }, configModel);
    expect(table.isGeoreferenced()).toEqual(false);
  });

  it('row fetch should request geometry', function () {
    // Hack: Inject username in window to avoid requiring
    // the userModel in RowModel
    window.user_name = 'testusername';

    table = CartoTableMetadataFixture({
      name: 'test',
      schema: [['the_geom', 'geometry'], ['testa', 'number']]
    }, configModel);

    var r = new RowModel({ cartodb_id: 100 }, { configModel });
    r.table = table;

    var sqlArg;
    spyOn(SQL.prototype, 'execute').and.callFake(sql => {
      sqlArg = sql;
      return { done: function () {} };
    });
    r.fetch();
    expect(sqlArg).toEqual('SELECT testa ,ST_AsGeoJSON(the_geom, 8) as the_geom  from (select * from test) _table_sql WHERE cartodb_id = 100');
    window.user_name = undefined;
  });

  it('row should not fetch the geom when no_geom is passed', function () {
    // Hack: Inject username in window to avoid requiring
    // the userModel in RowModel
    window.user_name = 'testusername';

    table = CartoTableMetadataFixture({
      name: 'test',
      schema: [['testa', 'number'], ['the_geom', 'geometry']]
    }, configModel);
    var r = new RowModel({ cartodb_id: 100 }, { configModel });
    r.table = table;

    var sqlArg;
    spyOn(SQL.prototype, 'execute').and.callFake(sql => {
      sqlArg = sql;
      return { done: function () {} };
    });

    r.fetch({ no_geom: true });

    expect(sqlArg).toEqual('SELECT testa  from (select * from test) _table_sql WHERE cartodb_id = 100');
    window.user_name = undefined;
  });

  it('row should not fetch the geom when no_geom is passed but quote the sql if needed', function () {
    // Hack: Inject username in window to avoid requiring
    // the userModel in RowModel
    window.user_name = 'testusername';
    table = CartoTableMetadataFixture({
      name: '000cd294-b124-4f82-b569-0f7fe41d2db8',
      schema: [['testa', 'number'], ['the_geom', 'geometry']]
    }, configModel);

    var r = new RowModel({ cartodb_id: 100 }, { configModel });
    r.table = table;

    var sqlArg;
    spyOn(SQL.prototype, 'execute').and.callFake(sql => {
      sqlArg = sql;
      return { done: function () {} };
    });

    r.fetch({ no_geom: true });

    expect(sqlArg).toEqual('SELECT testa  from (select * from "000cd294-b124-4f82-b569-0f7fe41d2db8") _table_sql WHERE cartodb_id = 100');
    window.user_name = undefined;
  });

  it("isGeoreferenced should be false when there isn't any geometry column", function () {
    expect(table.isGeoreferenced()).toEqual(false);
  });

  it("isGeoreferenced should be true when there's geom and data", function () {
    var r = new RowModel({
      cartodb_id: 100,
      the_geom: JSON.stringify({ type: 'point', coordinates: [2, 1] })
    }, { configModel });
    table = CartoTableMetadataFixture({
      name: 'test',
      schema: [['the_geom', 'geometry']]
    }, configModel);
    table.data().add(r);
    expect(table.isGeoreferenced()).toEqual(true);
  });

  it("isGeoreferenced should be true when there's geom and geometry data, but it's not loaded yet", function () {
    var r = new RowModel({
      cartodb_id: 100,
      the_geom: 'GeoJSON'
    }, { configModel });
    table = CartoTableMetadataFixture({
      name: 'test',
      schema: [['the_geom', 'geometry']]
    }, configModel);
    table.data().add(r);
    expect(table.isGeoreferenced()).toEqual(true);
  });

  it("isGeoreferenced should be false when there's geom and no georef data", function () {
    var r = new RowModel({
      cartodb_id: 100,
      the_geom: null
    }, { configModel });
    table = CartoTableMetadataFixture({
      name: 'test',
      schema: [['the_geom', 'geometry']],
      geometry_types: []
    }, configModel);
    table.data().add(r);
    expect(table.isGeoreferenced()).toEqual(false);
  });

  it('should change schema when a sqlview is reset', function () {
    var sqlView = new SQLViewDataModel(null, { sql: 'select * from a', configModel });
    table.useSQLView(sqlView);
    sqlView.reset([
      { a: 1, b: 2 }
    ]);
    spyOn(table._data, 'fetch');
    expect(sqlView.table).toEqual(table);
    table.useSQLView(null);
    expect(table._data.fetch).toHaveBeenCalled();
    expect(sqlView.table).toEqual(null);
  });

  it('should remove sqlview when sqlview executes a write query', function () {
    var sqlView = new SQLViewDataModel(null, { sql: 'insert bbblba', configModel });
    table.useSQLView(sqlView);
    spyOn(table, 'fetch');
    sqlView.modify_rows = true;
    sqlView.reset([
      { a: 1, b: 2 }
    ]);
    expect(table.isInSQLView()).toEqual(false);
  });

  it('it should return a row', function () {
    var r = table.data().getRow(1234);
    // This was set before to id attribute, but looks
    // like the code changed ¯\_(ツ)_/¯
    expect(r.get('cartodb_id')).toEqual(1234);
  });

  it('newRow should fetch the table if table is emtpy', function () {
    table.data().reset([]);
    var r = table.data().newRow();
    spyOn(table.data(), 'fetch');
    r.trigger('saved');
    expect(table.data().fetch).toHaveBeenCalled();
  });

  it('should be able to link to infowindow', function () {
    const info = new InfowindowModel({}, { configModel });
    info.addField('test').addField('test2');
    table.linkToInfowindow(info);
    table.trigger('columnRename', 'tt', 'test');
    expect(info.containsField('test')).toEqual(false);
    expect(info.containsField('tt')).toEqual(true);
    table.trigger('columnRename', 'java', 'tt');
    expect(info.containsField('tt')).toEqual(false);
  });

  it('should not clear infowindow on write queries', function () {
    const info = new InfowindowModel({}, { configModel });
    info.addField('test');
    table.linkToInfowindow(info);
    var sqlView = new SQLViewDataModel(null, { sql: 'select * from a', configModel });
    sqlView.url = 'test';
    table.useSQLView(sqlView);
    sqlView.modify_rows = true;
    sqlView.reset([]);
    expect(info.containsField('test')).toEqual(true);
  });

  it('should return default sql', function () {
    expect(table.data().getSQL()).toEqual('select * from testTable');
  });

  it('should retrieve a column type', function () {
    var type = table.getColumnType('test');
    expect(type).toEqual('string');
  });

  it('should add a column', function () {
    jasmine.Ajax.install();

    var succeded = false;
    var signalCalled = false;
    table.bind('columnAdd', function () {
      signalCalled = true;
    });
    table.addColumn('irrelevant1', 'string', {
      success: function () {
        succeded = true;
      }
    });
    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: '{"name":"irrelevant1","type":"text","cartodb_type":"string"}'
    });
    expect(succeded).toBeTruthy();
    expect(signalCalled).toEqual(true);
    jasmine.Ajax.uninstall();
  });

  it('should remove a column', function () {
    jasmine.Ajax.install();
    var succeded = false;
    table.bind('columnDelete', function () {
      succeded = true;
    });
    spyOn(table._data, 'fetch');
    table.deleteColumn('test');
    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: '{"name":"irrelevant1","type":"text","cartodb_type":"string"}'
    });
    expect(succeded).toBeTruthy();
    expect(table._data.fetch).toHaveBeenCalled();
    jasmine.Ajax.uninstall();
  });

  it("should not remove a column if it's invalid", function () {
    var succeded = false;
    table.bind('columnDelete', function () {
      succeded = true;
    });
    table.deleteColumn('');

    expect(succeded).not.toBeTruthy();
  });

  it('should rename a column', function () {
    jasmine.Ajax.install();
    var succeded = false;
    table.bind('columnRename', function (newName, oldName) {
      if (oldName === 'test' && newName === 'irrelevant') {
        succeded = true;
      }
    });
    spyOn(table._data, 'fetch');
    table.renameColumn('test', 'irrelevant');
    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: '{"name":"irrelevant1","type":"text","cartodb_type":"string"}'
    });
    expect(succeded).toBeTruthy();
    expect(table._data.fetch).toHaveBeenCalled();
    jasmine.Ajax.uninstall();
  });

  it('should be able to say if a type change is possible', function () {
    expect(table.isTypeChangeAllowed('test2', 'string')).toBeTruthy();
    expect(table.isTypeChangeAllowed('test2', 'date')).toBeFalsy();
    expect(table.isTypeChangeAllowed('test', 'date')).toBeTruthy();
  });

  it('should be able to say if a type change is destructive', function () {
    expect(table.isTypeChangeDestructive('test2', 'string')).toBeFalsy();
    expect(table.isTypeChangeDestructive('test', 'number')).toBeTruthy();
  });

  it('should change the type of a column', function () {
    jasmine.Ajax.install();
    var succeded = false;
    table.bind('typeChanged', function (newType) {
      if (newType === 'string') {
        succeded = true;
      }
    });
    spyOn(table._data, 'fetch');
    table.changeColumnType('test2', 'string');
    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 200,
      contentType: 'application/json',
      responseText: '{"name":"irrelevant1","type":"text","cartodb_type":"string"}'
    });
    expect(succeded).toBeTruthy();
    expect(table._data.fetch).toHaveBeenCalled();
    jasmine.Ajax.uninstall();
  });

  it("should trigger an error when there's any error saving the type change", function () {
    jasmine.Ajax.install();
    var succeded = false;
    table.bind('typeChangeFailed', function (newType) {
      if (newType === 'string') {
        succeded = true;
      }
    });
    table.changeColumnType('test2', 'string');
    jasmine.Ajax.requests.mostRecent().respondWith({
      status: 500,
      responseText: '{ "errors": ["Fake Error"]}'
    });
    expect(succeded).toBeTruthy();
    jasmine.Ajax.uninstall();
  });

  it('should do nothing when you try to change a column to its own type', function () {
    spyOn(table, 'saveNewColumnType');

    table.changeColumnType('test', 'string');

    expect(table.saveNewColumnType).not.toHaveBeenCalled();
  });

  it('shoudl not fetch data when geometry_types change', function () {
    table.trigger('change');
    spyOn(table._data, 'fetch');
    table.set('geometry_types', ['st_polygon', 'st_multilinestring']);
    expect(table._data.fetch).not.toHaveBeenCalled();
  });

  it('should raise when read only is set', function () {
    var called = 0;
    table.bind('change:readOnly', function () {
      ++called;
    });
    table.setReadOnly(true);
    expect(called).toEqual(1);
    table.setReadOnly(true);
    expect(called).toEqual(1);
    table.setReadOnly(false);
    expect(called).toEqual(2);
  });

  describe('.duplicate', function () {
    beforeEach(function () {
      spyOn(ImportModel.prototype, 'save');
    });

    describe('when table is in SQL view', function () {
      beforeEach(function () {
        spyOn(table, 'isInSQLView').and.returnValue(true);
        table.duplicate('foobar', {});
      });

      it('should the new table name', function () {
        expect(ImportModel.prototype.save).toHaveBeenCalled();
        expect(ImportModel.prototype.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ table_name: 'foobar' }));
      });

      it('should return an object with SQL', function () {
        expect(ImportModel.prototype.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ sql: 'select * from testTable' }));
      });
    });

    describe('when table is not in SQL view', function () {
      beforeEach(function () {
        spyOn(table, 'isInSQLView').and.returnValue(false);
        table.duplicate('foobar', {});
      });

      it('should the new table name', function () {
        expect(ImportModel.prototype.save).toHaveBeenCalled();
        expect(ImportModel.prototype.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ table_name: 'foobar' }));
      });

      it('should return an object with SQL', function () {
        expect(ImportModel.prototype.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ table_copy: 'testTable' }));
      });
    });

    describe('when import creation fails', function () {
      beforeEach(function () {
        this.errorCallback = jasmine.createSpy('error');
        table.duplicate('foobar', {
          error: this.errorCallback
        });
        ImportModel.prototype.save.calls.argsFor(0)[1].error();
      });

      it('should call the error callback', function () {
        expect(this.errorCallback).toHaveBeenCalled();
      });
    });

    describe('when import creation succeeds', function () {
      let importModelError, importModelCompleted;

      beforeEach(function () {
        const originalBind = ImportModel.prototype.bind;
        spyOn(ImportModel.prototype, 'pollCheck');
        spyOn(ImportModel.prototype, 'bind').and.callFake(function (event, callback) {
          if (event === 'importError') {
            importModelError = this;
          }

          if (event === 'importComplete') {
            importModelCompleted = this;
            console.log('importComplete', importModelCompleted);
          }

          originalBind.apply(this, arguments);
        });

        this.errorCallback = jasmine.createSpy('error');
        this.successCallback = jasmine.createSpy('success');

        table.duplicate('foobar', {
          error: this.errorCallback,
          success: this.successCallback
        });

        ImportModel.prototype.save.calls.argsFor(0)[1].success(this.fakeImport, { item_queue_id: 'abc-123' });
      });

      afterEach(function () {
        importModelError.unbind();
        importModelCompleted.unbind();
        importModelError = undefined;
        importModelCompleted = undefined;
      });

      xit('should create a new import model from the old one', function () {
        // Untestable
        expect(ImportModel.calls.count()).toEqual(2);
        expect(ImportModel.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({ item_queue_id: 'abc-123' }));
      });

      it('should start checking for import status', function () {
        expect(ImportModel.prototype.pollCheck).toHaveBeenCalled();
      });

      describe('when import fails', function () {
        beforeEach(function () {
          importModelError.trigger('importError', 1, 2, 3);
        });

        it('should called error callback with args', function () {
          expect(this.errorCallback).toHaveBeenCalled();
          expect(this.errorCallback).toHaveBeenCalledWith(1, 2, 3);
        });
      });

      describe('when import succeeds', function () {
        let createdTable;

        beforeEach(function () {
          spyOn(CartoTableMetadata.prototype, 'fetch').and.callFake(function (options) {
            options.success && options.success();
          });
          this.fakeTable = new CartoTableMetadata(null, { configModel });

          importModelCompleted.set('table_id', 'abc-123');

          this.successCallback.and.callFake(function (newTable) {
            console.log(newTable);
            createdTable = newTable;
          });

          importModelCompleted.trigger('importComplete');
        });

        it('should create new table from imported table id', function () {
          expect(createdTable).toEqual(jasmine.objectContaining({ id: 'abc-123' }));
        });

        it('should fetch all table data for it to be ready', function () {
          expect(createdTable.fetch).toHaveBeenCalled();
        });

        describe('when table fetch fails', function () {
          beforeEach(function () {
            createdTable.fetch.calls.argsFor(0)[0].error(1, 2, 3);
          });

          it('should call error callback with args', function () {
            expect(this.errorCallback).toHaveBeenCalled();
            expect(this.errorCallback).toHaveBeenCalledWith(1, 2, 3);
          });
        });

        describe('when table fetch succeeds', function () {
          beforeEach(function () {
            createdTable.fetch.calls.argsFor(0)[0].success();
          });

          it('should call the sucess callback with new table', function () {
            expect(this.successCallback).toHaveBeenCalled();
            expect(this.successCallback).toHaveBeenCalledWith(createdTable);
          });
        });
      });
    });
  });

  describe('.dependentVisualizations', function () {
    it('should return a list', function () {
      expect(table.dependentVisualizations()).toEqual([]);
    });

    describe('when there are at least some dependent/non-dependent visualizations', function () {
      beforeEach(function () {
        table.set({
          dependent_visualizations: [{id: 'dv1'}, {id: 'dv2'}],
          non_dependent_visualizations: [{id: 'ndv1'}]
        });
      });

      it('should return them as a list', function () {
        var results = table.dependentVisualizations();
        expect(results.length).toEqual(3);
        expect(_.pluck(results, 'id')).toEqual(['dv1', 'dv2', 'ndv1']);
      });
    });
  });
});
