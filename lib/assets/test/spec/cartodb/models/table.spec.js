
describe("admin table", function() {

  describe("cbd.admin.Column", function() {
      var column;
      beforeEach(function() {
        var table = new cdb.admin.CartoDBTableMetadata({
          id: 'testTable',
          name: 'testTable'
        });
        column = new cdb.admin.Column({
          table: table,
          name: 'columnName'
        });
      });

      it("should have correct url", function() {
        expect(column.url()).toEqual(
          '/api/v1/tables/testTable/columns/columnName'
        );
      });
  });

  describe("cbd.admin.CartoDBTableMetadata", function() {
    var table;
    beforeEach(function() {
      table = new cdb.admin.CartoDBTableMetadata({
        id: 'testTable',
        name: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number']
        ]
      });
    });

    it("should return columntypes", function() {
      expect(table.columnTypes()).toEqual({
        test: 'string',
        test2: 'number'
      })
    })

    it("should return unqualified name", function() {
      ntable = new cdb.admin.CartoDBTableMetadata({
        id: '"kease".testTable',
        name: '"kease".testTable'
      });
      expect(ntable.getUnqualifiedName()).toEqual('testTable');
      expect(table.getUnqualifiedName()).toEqual('testTable');
    });

    it("should add geometrytypes when adding a row", function() {
      table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number']
        ],
        geometry_types: []
      });
      table.data().add({ cartodb_id: 2 });
      var r = table.data().get(2);
      r.set('the_geom', '{"type": "point", "coordinates": [1,2]}');
      expect(table.get('geometry_types')).toEqual(['st_point']);
    });

    it("geometryTypeChanged", function() {
      var changed = null;
      table.bind('change', function() {
        changed = table.geometryTypeChanged()
      })

      table.set('geometry_types', ['ST_Point'])
      expect(changed).toEqual(true);
      changed = null;
      table.set('geometry_types', ['ST_Point'])
      expect(changed).toEqual(null);
      changed = null;
      table.set('geometry_types', ['ST_MultiPoint'])
      expect(changed).toEqual(false);
      changed = null;
      table.set('geometry_types', ['ST_Polygon'])
      expect(changed).toEqual(true);
      changed = null;
      table.unset('geometry_types')
      expect(changed).toEqual(true);

    });

    it("should be read only if it's synced", function() {
      expect(table.isReadOnly()).toEqual(false);
      table.synchronization.set('id', 'test');
      expect(table.isReadOnly()).toEqual(true);
    });

    it("should emit sync changes", function() {
      var s = sinon.spy();
      table.bind('change:isSync', s);
      table.synchronization.set('id', 'test');
      expect(s.called).toEqual(true);
      expect(s.firstCall.args[1]).toEqual(true);
      table.synchronization.unset('id');
      expect(s.secondCall.args[1]).toEqual(false);
    });

    it("should create column types", function() {
      expect(table._getColumn('test').get('type')).toEqual('string');
      expect(table._getColumn('test2').get('type')).toEqual('number');
      table.set({ schema:[
          ['test', 'number'],
          ['test2', 'number']
        ]
      });
      expect(table._getColumn('test').get('type')).toEqual('number');
    });

    it("should sort schema", function() {
      table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['otra_foobar', 'string'],
          ['test2', 'number'],
          ['_desc', 'string'],
          ['other', 'string'],
          ['the_geom', 'geometry'],
          ["created_at", "date"],
          ['updated_at', 'date'],
          ['cartodb_id', 'number']
        ]
      });
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
          ["created_at", "date"],
          ["updated_at", "date"]
        ]
      );

      expect(changeSchemaSpy).toHaveBeenCalled();
    });

    it("should copy the types of the original schema" ,function() {
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });

      table.useSQLView(sqlView);
      sqlView.query_schema = {
        'test': 'string',
        'test3': 'number'
      }
      sqlView.reset([
        { test: 1, b:2 }
      ]);


      expect(table.getColumnType('test')).toEqual("string");
      expect(table.getColumnType('test3')).toEqual("number");
      expect(table.getColumnType('test2')).toEqual(undefined);

      table.useSQLView(null);

      expect(table.getColumnType('test')).toEqual("string");
      expect(table.getColumnType('test3')).toEqual(undefined);
      expect(table.getColumnType('b')).toEqual(undefined);

    });

    it("should have a original_schema" ,function() {
      var s = _.clone(table.get('schema'));
      expect(table.get('original_schema')).toEqual(s)
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      table.useSQLView(sqlView);
      sqlView.reset([
        { a: 1, b:2 }
      ]);
      expect(table.get('original_schema')).toEqual(s)
      expect(table.get('schema')).not.toEqual(s)
    });

    it("should return geom column types", function() {
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

    it("should return stats geom column types", function() {
      table.set({ stats_geometry_types: ['ST_MultiPolygon']});
      expect(table.statsGeomColumnTypes()).toEqual(['polygon']);
    });

    it("hasgeomtype", function() {
      var r = new cdb.admin.Row({
        cartodb_id: 100,
        the_geom: JSON.stringify({ type: 'point', coordinates: [2,1] })
      });
      expect(r.hasGeometry()).toEqual(true);
      r.set('the_geom', null);
      expect(r.hasGeometry()).toEqual(false);
      r.set('the_geom', undefined);
      expect(r.hasGeometry()).toEqual(false);

    });

    it("should know if the_geom contains a geoJSON", function() {
      var a = {
        cartodb_id: 100,
        the_geom: JSON.stringify({ type: 'point', coordinates: [2,1] })
      };
      var r = new cdb.admin.Row(a);
      expect(r.isGeometryGeoJSON()).toBeTruthy();
      a.the_geom = 'asdasdsad';
      r = new cdb.admin.Row(a);
      expect(r.isGeometryGeoJSON()).toBeFalsy();
    })


    it("tojson should not include the_geom if is not in geojson format", function() {
      var a = {
        cartodb_id: 100,
        the_geom: JSON.stringify({ type: 'point', coordinates: [2,1] })
      };
      var r = new cdb.admin.Row(a);
      expect(r.toJSON().the_geom).toEqual(a.the_geom);
      a.the_geom = 'asdasdsad';
      r = new cdb.admin.Row(a);
      expect(r.toJSON().the_geom).toEqual(undefined);
    })

    it("tojson should not include the_geom_webmercator, created_at or updated_at", function() {
      var a = {
        cartodb_id: 100,
        updated_at: 1,
        created_at: 1,
        the_geom_webmercator: 1
      };
      var r = new cdb.admin.Row(a);
      expect(r.toJSON().the_geom).toEqual(undefined);
      expect(r.toJSON().created_at).toEqual(undefined);
      expect(r.toJSON().updated_at).toEqual(undefined);
    });

    it("altertable", function() {
      var t = cdb.admin.CartoDBTableMetadata;

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

    it("altertabledata", function() {
      var t = cdb.admin.CartoDBTableMetadata;
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

    it("isGeoreferenced should be false when there's geom and no data", function() {
      var r = new cdb.admin.Row({
        cartodb_id: 100,
        the_geom: JSON.stringify({ type: 'point', coordinates: [2,1] })
      });
      table = TestUtil.createTable('test', [['the_geom', 'geometry']], []);
      expect(table.isGeoreferenced()).toEqual(false);
    });

    it("row fetch should request geometry", function() {
      table = TestUtil.createTable('test', [['the_geom', 'geometry'],['testa', 'number']]);
      var r = new cdb.admin.Row({ cartodb_id: 100 });
      r.table = table;
      var args;
      r.sqlApiClass = function() {
        return {
          execute: function() {
            args = Array.prototype.slice.call(arguments);
            return { done: function() {} };
          }
        };
      };
      r.fetch();
      expect(args[0]).toEqual('SELECT testa ,ST_AsGeoJSON(the_geom, 8) as the_geom  from (select * from test) _table_sql WHERE cartodb_id = 100')
    });

    it("row should not fetch the geom when no_geom is passed", function() {
      table = TestUtil.createTable('test', [['testa', 'number'],['the_geom', 'geometry']]);
      var r = new cdb.admin.Row({ cartodb_id: 100 });
      r.table = table;
      var args;
      r.sqlApiClass = function() {
        return {
          execute: function() {
            args = Array.prototype.slice.call(arguments);
            return { done: function() {} };
          }
        };
      };
      r.fetch({ no_geom: true });
      expect(args[0]).toEqual('SELECT testa  from (select * from test) _table_sql WHERE cartodb_id = 100')
    });

    it("row should not fetch the geom when no_geom is passed but quote the sql if needed", function() {
      table = TestUtil.createTable('000cd294-b124-4f82-b569-0f7fe41d2db8', [['testa', 'number'],['the_geom', 'geometry']]);
      var r = new cdb.admin.Row({ cartodb_id: 100 });
      r.table = table;
      var args;
      r.sqlApiClass = function() {
        return {
          execute: function() {
            args = Array.prototype.slice.call(arguments);
            return { done: function() {} };
          }
        };
      };
      r.fetch({ no_geom: true });
      expect(args[0]).toEqual('SELECT testa  from (select * from "000cd294-b124-4f82-b569-0f7fe41d2db8") _table_sql WHERE cartodb_id = 100')
    })

    it("isGeoreferenced should be false when there isn't any geometry column", function() {
      expect(table.isGeoreferenced()).toEqual(false);
    });

    it("isGeoreferenced should be true when there's geom and data", function() {
      var r = new cdb.admin.Row({
        cartodb_id: 100,
        the_geom: JSON.stringify({ type: 'point', coordinates: [2,1] })
      });
      table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
      table.data().add(r);
      expect(table.isGeoreferenced()).toEqual(true);
    });

    it("isGeoreferenced should be true when there's geom and geometry data, but it's not loaded yet", function() {
      var r = new cdb.admin.Row({
        cartodb_id: 100,
        the_geom: 'GeoJSON'
      });
      table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
      table.data().add(r);
      expect(table.isGeoreferenced()).toEqual(true);
    });


    it("isGeoreferenced should be false when there's geom and no georef data", function() {
      var r = new cdb.admin.Row({
        cartodb_id: 100,
        the_geom: null
      });
      table = TestUtil.createTable('test', [['the_geom', 'geometry']], []);
      table.data().add(r);
      expect(table.isGeoreferenced()).toEqual(false);
    });


    it("should change schema when a sqlview is reset", function() {
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      table.useSQLView(sqlView);
      sqlView.reset([
        { a: 1, b:2 }
      ]);
      spyOn(table._data, 'fetch');
      expect(sqlView.table).toEqual(table);
      table.useSQLView(null);
      expect(table._data.fetch).toHaveBeenCalled();
      expect(sqlView.table).toEqual(null);
    });

    it("should remove sqlview when sqlview executes a write query", function() {
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'insert bbblba' });
      table.useSQLView(sqlView);
      spyOn(table, 'fetch');
      sqlView.modify_rows = true;
      sqlView.reset([
        { a: 1, b:2 }
      ]);
      expect(table.isInSQLView()).toEqual(false);
    });

    it("it should return a row", function() {
        var r = table.data().getRow(1234);
        expect(r.id).toEqual(1234);
    });

    it("newRow should fetch the table if table is emtpy", function() {
        table.data().reset([]);
        var r = table.data().newRow();
        spyOn(table.data(), 'fetch')
        r.trigger('saved');
        expect(table.data().fetch).toHaveBeenCalled();
    });

    it("should be able to link to infowindow", function() {
      info = new cdb.geo.ui.InfowindowModel();
      info.addField('test').addField('test2');
      table.linkToInfowindow(info);
      table.trigger('columnRename', 'tt', 'test');
      expect(info.containsField('test')).toEqual(false);
      expect(info.containsField('tt')).toEqual(true);
      table.trigger('columnRename', 'java', 'tt');
      expect(info.containsField('tt')).toEqual(false);
    });

    it("should not clear infowindow on write queries", function() {
      info = new cdb.geo.ui.InfowindowModel();
      info.addField('test')
      table.linkToInfowindow(info);
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      sqlView.url = 'test'
      table.useSQLView(sqlView);
      sqlView.modify_rows = true;
      sqlView.reset([]);
      expect(info.containsField('test')).toEqual(true);

    });

    it("should restore the infowindow fields for an sql view", function() {
      info = new cdb.geo.ui.InfowindowModel();
      info.addField('test')
      table.linkToInfowindow(info);
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a limit 10' });
      table.useSQLView(sqlView);

      sqlView.query_schema = {
        'a':  'string',
        'b': 'number'
      }
      sqlView.reset([ { a: 1, b:2 } ]);
      info.addField('a').addField('b');

      // apply different sql view
      sqlView.query_schema = {
        'c': 'string',
        'd': 'number'
      }
      sqlView.reset([ { c: 1, d:2 } ]);
      info.addField('c').addField('d');

      // apply the first one again
      sqlView.query_schema = {
        'b': 'number',
        'a': 'string'
      };
      sqlView.reset([ { a: 1, b:2 } ]);
      expect(info.containsField('a')).toEqual(true);
      expect(info.containsField('b')).toEqual(true);


    });

    it("should restore the infowindow fields after clear a sql view", function() {
      info = new cdb.geo.ui.InfowindowModel();
      info.addField('test')
      table.linkToInfowindow(info);
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      table.useSQLView(sqlView);
      sqlView.query_schema = {
        'test':'string',
        'b':  'number'
      }
      sqlView.reset([
        { a: 1, b:2 }
      ]);
      spyOn(table, 'fetch');
      expect(sqlView.table).toEqual(table);
      expect(info.containsField('test')).toEqual(true);
      expect(info.containsField('b')).not.toEqual(true);
      table.useSQLView(null);
      expect(info.containsField('test')).toEqual(true);
      expect(info.containsField('test2')).toEqual(false);
      // apply a query twice
      table.useSQLView(sqlView);
      sqlView.reset([
        { a: 1, b:2 }
      ]);
      sqlView.reset([
        { a: 1, b:2, c:3 }
      ]);
      table.useSQLView(null);
      expect(info.containsField('test')).toEqual(true);
      expect(info.containsField('test2')).toEqual(false);
    });

    it("should return default sql", function() {
      expect(table.data().getSQL()).toEqual('select * from testTable');
    });

    it("should retrieve a column type", function() {
      var type = table.getColumnType("test");
      expect(type).toEqual("string");
    })

    it("should add a column", function() {
      var server = sinon.fakeServer.create();
      server.respondWith("POST", "/api/v1/tables/" + table.get('name') + "/columns/",
        [200, { "Content-Type": "application/json" },
       '{"name":"irrelevant1","type":"text","cartodb_type":"string"}']);
      var succeded = false;
      var signalCalled = false;
      table.bind('columnAdd', function() {
        signalCalled = true;
      });
      table.addColumn('irrelevant1', 'string', {
        success: function() {
          succeded = true;
        }
      })
      server.respond();
      expect(succeded).toBeTruthy();
      expect(signalCalled).toEqual(true);
    })

    it("should remove a column", function() {
      var server = sinon.fakeServer.create();
      server.respondWith("DELETE", "/api/v1/tables/" + table.get('name') + "/columns/test",
        [200, { "Content-Type": "application/json" },
       '{"name":"irrelevant1","type":"text","cartodb_type":"string"}']);
      var succeded = false;
      table.bind('columnDelete', function() {
        succeded = true;
      });
      spyOn(table._data, 'fetch');
      table.deleteColumn('test');
      server.respond();
      expect(succeded).toBeTruthy();
      expect(table._data.fetch).toHaveBeenCalled();
    });

    it("should not remove a column if it's invalid", function() {
      var server = sinon.fakeServer.create();
      server.respondWith("DELETE", "/api/v1/tables/" + table.get('name') + "/columns/test",
        [200, { "Content-Type": "application/json" },
       '{"name":"irrelevant1","type":"text","cartodb_type":"string"}']);
      var succeded = false;
      table.bind('columnDelete', function() {
        succeded = true;
      });
      table.deleteColumn('');
      server.respond();
      expect(succeded).not.toBeTruthy();
    });

    it("should rename a column", function() {
      var server = sinon.fakeServer.create();
      server.respondWith("PUT", "/api/v1/tables/" + table.get('name') + "/columns/test",
        [200, { "Content-Type": "application/json" },
       '{"name":"irrelevant1","type":"text","cartodb_type":"string"}']);
      var succeded = false;
      table.bind('columnRename', function(newName, oldName) {
        if(oldName == 'test' && newName == 'irrelevant')
          succeded = true;
      });
      spyOn(table._data, 'fetch');
      table.renameColumn('test', 'irrelevant');
      server.respond();
      expect(succeded).toBeTruthy();
      expect(table._data.fetch).toHaveBeenCalled();
    })

    it("should be able to say if a type change is possible", function() {
      expect(table.isTypeChangeAllowed("test2","string")).toBeTruthy();
      expect(table.isTypeChangeAllowed("test2","date")).toBeFalsy();
      expect(table.isTypeChangeAllowed("test","date")).toBeTruthy();
    });

    it("should be able to say if a type change is destructive", function() {
      expect(table.isTypeChangeDestructive("test2","string")).toBeFalsy();
      expect(table.isTypeChangeDestructive("test","number")).toBeTruthy();
    });

    it("should change the type of a column", function() {
      var server = sinon.fakeServer.create();
      server.respondWith("PUT", "/api/v1/tables/" + table.get('name') + "/columns/test2",
        [200, { "Content-Type": "application/json" },
       '{"name":"irrelevant1","type":"text","cartodb_type":"string"}']);
      var succeded = false;
      table.bind('typeChanged', function(newType) {
        if(newType = 'string')
          succeded = true;
      });
      spyOn(table._data, 'fetch');
      table.changeColumnType('test2', 'string');
      server.respond();
      expect(succeded).toBeTruthy();
      expect(table._data.fetch).toHaveBeenCalled();
    })

    it("should trigger an error when there's any error saving the type change", function() {
      var server = sinon.fakeServer.create();
      server.respondWith("PUT", "/api/v1/tables/" + table.get('name') + "/columns/test",
        [500, { "Content-Type": "application/json" },
       '{"name":"irrelevant1","type":"text","cartodb_type":"string"}']);
      var succeded = false;
      table.bind('typeChangeFailed', function(newType) {
        if(newType = 'string')
          succeded = true;
      });
      table.changeColumnType('test2', 'string');
      server.respond();
      expect(succeded).toBeTruthy();
    })




    it("should do nothing when you try to change a column to its own type", function() {
      var s = sinon.spy();
      spyOn(table, 'saveNewColumnType');

      table.changeColumnType('test', 'string');

      expect(table.saveNewColumnType).not.toHaveBeenCalled();
    });

    it("shoudl not fetch data when geometry_types change", function() {
      table.trigger('change');
      spyOn(table._data, 'fetch');
      table.set('geometry_types', ['st_polygon', 'st_multilinestring']);
      expect(table._data.fetch).not.toHaveBeenCalled()
    });

    it("should raise when read only is set", function() {
      var called = 0;
      table.bind('change:readOnly', function() {
        ++called;
      })
      table.setReadOnly(true);
      expect(called).toEqual(1)
      table.setReadOnly(true);
      expect(called).toEqual(1)
      table.setReadOnly(false);
      expect(called).toEqual(2)
    });

    describe('.duplicate', function() {
      beforeEach(function() {
        var self = this;
        this.fakeImport = new cdb.admin.Import();
        spyOn(this.fakeImport, 'save');
        spyOn(cdb.admin, 'Import').and.callFake(function() {
          return self.fakeImport;
        });
      });

      describe('when table is in SQL view', function() {
        beforeEach(function() {
          spyOn(table, 'isInSQLView').and.returnValue(true);
          table.duplicate('foobar', {});
        });

        it('should the new table name', function() {
          expect(this.fakeImport.save).toHaveBeenCalled();
          expect(this.fakeImport.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ table_name: 'foobar' }));
        });

        it('should return an object with SQL', function() {
          expect(this.fakeImport.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ sql: 'select * from testTable' }));
        });
      });

      describe('when table is not in SQL view', function() {
        beforeEach(function() {
          spyOn(table, 'isInSQLView').and.returnValue(false);
          table.duplicate('foobar', {});
        });

        it('should the new table name', function() {
          expect(this.fakeImport.save).toHaveBeenCalled();
          expect(this.fakeImport.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ table_name: 'foobar' }));
        });

        it('should return an object with SQL', function() {
          expect(this.fakeImport.save.calls.argsFor(0)[0]).toEqual(jasmine.objectContaining({ table_copy: 'testTable' }));
        });
      });

      describe('when import creation fails', function() {
        beforeEach(function() {
          this.errorCallback = jasmine.createSpy('error');
          table.duplicate('foobar', {
            error: this.errorCallback
          });
          this.fakeImport.save.calls.argsFor(0)[1].error();
        });

        it('should call the error callback', function() {
          expect(this.errorCallback).toHaveBeenCalled();
        });
      });

      describe('when import creation succeeds', function() {
        beforeEach(function() {
          this.errorCallback = jasmine.createSpy('error');
          this.successCallback = jasmine.createSpy('success');
          spyOn(this.fakeImport, 'pollCheck');
          table.duplicate('foobar', {
            error: this.errorCallback,
            success: this.successCallback
          });
          this.fakeImport.save.calls.argsFor(0)[1].success(this.fakeImport, { item_queue_id: 'abc-123' });
        });

        it('should create a new import model from the old one', function() {
          expect(cdb.admin.Import.calls.count()).toEqual(2);
          expect(cdb.admin.Import.calls.argsFor(1)[0]).toEqual(jasmine.objectContaining({ item_queue_id: 'abc-123' }));
        });

        it('should start checking for import status', function() {
          expect(this.fakeImport.pollCheck).toHaveBeenCalled();
        });

        describe('when import fails', function() {
          beforeEach(function() {
            this.fakeImport.trigger('importError', 1, 2, 3);
          });

          it('should called error callback with args', function() {
            expect(this.errorCallback).toHaveBeenCalled();
            expect(this.errorCallback).toHaveBeenCalledWith(1, 2, 3);
          });
        });

        describe('when import succeeds', function() {
          beforeEach(function() {
            var self = this;
            this.fakeTable = new cdb.admin.CartoDBTableMetadata();
            this.fakeImport.set('table_id', 'abc-123');
            spyOn(cdb.admin, 'CartoDBTableMetadata').and.callFake(function() {
              return self.fakeTable;
            });
            spyOn(this.fakeTable, 'fetch');
            this.fakeImport.trigger('importComplete');
          });

          it('should create new table from imported table id', function() {
            expect(cdb.admin.CartoDBTableMetadata).toHaveBeenCalled();
            expect(cdb.admin.CartoDBTableMetadata).toHaveBeenCalledWith(jasmine.objectContaining({ id: 'abc-123' }));
          });

          it('should fetch all table data for it to be ready', function() {
            expect(this.fakeTable.fetch).toHaveBeenCalled();
          });

          describe('when table fetch fails', function() {
            beforeEach(function() {
              this.fakeTable.fetch.calls.argsFor(0)[0].error(1, 2, 3);
            });

            it('should call error callback with args', function() {
              expect(this.errorCallback).toHaveBeenCalled();
              expect(this.errorCallback).toHaveBeenCalledWith(1, 2, 3);
            });
          });

          describe('when table fetch succeeds', function() {
            beforeEach(function() {
              this.fakeTable.fetch.calls.argsFor(0)[0].success();
            });

            it('should call the sucess callback with new table', function() {
              expect(this.successCallback).toHaveBeenCalled();
              expect(this.successCallback).toHaveBeenCalledWith(this.fakeTable);
            });
          });
        });
      });
    });

    describe('.dependentVisualizations', function() {
      it('should return a list', function() {
        expect(table.dependentVisualizations()).toEqual([]);
      });

      describe('when there are at least some dependent/non-dependent visualizations', function() {
        beforeEach(function() {
          table.set({
            dependent_visualizations: [{id: 'dv1'},{id: 'dv2'}],
            non_dependent_visualizations: [{id: 'ndv1'}]
          })
        });

        it('should return them as a list', function() {
          var results = table.dependentVisualizations();
          expect(results.length).toEqual(3);
          expect(_.pluck(results, 'id')).toEqual(['dv1', 'dv2', 'ndv1']);
        });
      });
    });
  });

  describe("cbd.admin.CartoDBTableData", function() {
    var table;
    var tableData;

    beforeEach(function() {

      table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number']
        ],
      });
      // let's use a mock instead of the real SQL api class
      table.sqlApiClass = cartodb.SQLMock;
      table.sqlApiClass.setResponse('execute', {rows:['row']});

      tableData = new cdb.admin.CartoDBTableData(null, {
        table: table
      });
    });

    it("should reset pagination on fetch", function() {
      tableData.fetch();
      expect(tableData.options.get('page')).toEqual(0);
      expect(tableData.options.previous('page')).toEqual(0);
      tableData.options.set('page', 1);
      tableData.fetch({ add: true });
      expect(tableData.options.get('page')).toEqual(1);
    });

    it("should allow user to paginate past 10th page", function() {
      tableData.fetch();
      tableData.pages = [6, 7, 8, 9];
      tableData.options.set('page', 1);
      tableData.size = function() {return 100000};
      tableData.newPage(10, 'down')
      expect(tableData.pages).toEqual([7, 8, 9, 10]);
    });

    it("should allow refresh all table data", function() {
      spyOn(tableData.table, 'fetch').and.callFake(function(obj) {
        obj.complete();
      });
      spyOn(tableData, 'fetch');
      tableData.refresh();
      expect(tableData.fetch).toHaveBeenCalled();
    });

    it("url should include sql query", function() {
      spyOn(Backbone, 'sync');
      table.set({
        name: 'testTable',
        id: 'testTable',
      })
      var the_geom = ["CASE",
        "WHEN GeometryType(the_geom) = 'POINT' THEN",
          "ST_AsGeoJSON(the_geom,8)",
        "WHEN (the_geom IS NULL) THEN",
          "NULL",
        "ELSE",
          "GeometryType(the_geom)",
        "END the_geom"].join(' ')
      var sql = "select \"cartodb_id\",\"test\",\"test2\","+ the_geom +" from (select * from testTable) __wrapped order by cartodb_id asc";
      tableData.query_schema = {
        'cartodb_id': 'integer',
        'test': 'string',
        'test2': 'number',
        'the_geom': 'geometry'
      }

      tableData.sync();
      var postData = Backbone.sync.calls.mostRecent().args[2].data;
      expect(postData.indexOf(encodeURIComponent(sql))).not.toEqual(-1);
      expect(postData.indexOf('rows_per_page=40')).not.toEqual(-1);
      expect(postData.indexOf("the_geom_webmercator")).toEqual(-1);

      tableData.query_schema = {
        'test': 'string',
        'test2': 'number',
      }

      tableData.sync();
      postData = Backbone.sync.calls.mostRecent().args[2].data;
      var sql = "select \"test\",\"test2\" from (select * from testTable) __wrapped order by cartodb_id asc";
      expect(postData.indexOf(encodeURIComponent(sql))).not.toEqual(-1);
      expect(postData.indexOf("the_geom_webmercator")).toEqual(-1);

      tableData.options.set('sort_order', 'desc');
      tableData.options.set('order_by', 'test');

      sql = "select \"test\",\"test2\" from (select * from testTable) __wrapped order by test desc";
      tableData.sync();
      postData = Backbone.sync.calls.mostRecent().args[2].data;
      expect(postData.indexOf(encodeURIComponent(sql))).not.toEqual(-1);
    });

    it("url should include sql query quoting the table name if needed", function() {
      spyOn(Backbone, 'sync');
      table.set({
        name: '000cd294-b124-4f82-b569-0f7fe41d2db8',
        id: '000cd294-b124-4f82-b569-0f7fe41d2db8',
      })
      var the_geom = ["CASE",
        "WHEN GeometryType(the_geom) = 'POINT' THEN",
          "ST_AsGeoJSON(the_geom,8)",
        "WHEN (the_geom IS NULL) THEN",
          "NULL",
        "ELSE",
          "GeometryType(the_geom)",
        "END the_geom"].join(' ')
      var sql = "select \"cartodb_id\",\"test\",\"test2\","+ the_geom +" from (select * from \"000cd294-b124-4f82-b569-0f7fe41d2db8\") __wrapped order by cartodb_id asc";
      tableData.query_schema = {
        'cartodb_id': 'integer',
        'test': 'string',
        'test2': 'number',
        'the_geom': 'geometry'
      }

      tableData.sync();
      var postData = Backbone.sync.calls.mostRecent().args[2].data;
      expect(postData.indexOf(encodeURIComponent(sql))).not.toEqual(-1);
      expect(postData.indexOf('rows_per_page=40')).not.toEqual(-1);
      expect(postData.indexOf("the_geom_webmercator")).toEqual(-1);

      tableData.query_schema = {
        'test': 'string',
        'test2': 'number',
      }

      tableData.sync();
      postData = Backbone.sync.calls.mostRecent().args[2].data;
      var sql = "select \"test\",\"test2\" from (select * from \"000cd294-b124-4f82-b569-0f7fe41d2db8\") __wrapped order by cartodb_id asc";
      expect(postData.indexOf(encodeURIComponent(sql))).not.toEqual(-1);
      expect(postData.indexOf("the_geom_webmercator")).toEqual(-1);

      tableData.options.set('sort_order', 'desc');
      tableData.options.set('order_by', 'test');

      sql = "select \"test\",\"test2\" from (select * from \"000cd294-b124-4f82-b569-0f7fe41d2db8\") __wrapped order by test desc";
      tableData.sync();
      postData = Backbone.sync.calls.mostRecent().args[2].data;
      expect(postData.indexOf(encodeURIComponent(sql))).not.toEqual(-1);
    });

    it("should add params to the request", function() {
      spyOn(Backbone, 'sync');
      tableData.query_schema = {
        'cartodb_id': 'integer',
        'test': 'string',
        'test2': 'number',
        'the_geom': 'geometry'
      }
      tableData.sync();
      var postData = Backbone.sync.calls.mostRecent().args[2].data;
      expect(postData.indexOf('rows_per_page=40')).not.toEqual(-1);
    });

    it("should call fetch when options change", function() {
      spyOn(tableData, 'fetch');
      tableData.loadPageAtBottom();
      //expect(tableData.url().indexOf('page=1')).not.toEqual(-1);
      expect(tableData.fetch).toHaveBeenCalled();
    });

    it("should manage page blocks", function() {
      var rows_to_return = 40;
      tableData.sync = function(_a, _b, opts) {
        var r = [];
        for(var i = 0; i < rows_to_return; ++i) {
          r.push({
            cartodb_id: i + tableData.options.get('page')*40,
            jaja: 'test'
          })
        }
        opts.success({ rows: r, modified: false })
      };
      tableData._sqlQuery = function(sql, callback) {
        callback({
        'cartodb_id': 'integer',
        'test': 'string',
        'test2': 'number',
        'the_geom': 'geometry'
        })
      }
      tableData.fetch();
      expect(tableData.pages).toEqual([0]);
      expect(tableData.size()).toEqual(40);
      tableData.loadPageAtBottom();
      expect(tableData.pages).toEqual([0, 1]);
      expect(tableData.size()).toEqual(2*40);
      tableData.loadPageAtBottom();
      expect(tableData.pages).toEqual([0, 1, 2]);
      expect(tableData.size()).toEqual(3*40);
      tableData.loadPageAtBottom();
      expect(tableData.pages).toEqual([0, 1, 2, 3]);
      expect(tableData.size()).toEqual(4*40);
      tableData.loadPageAtBottom();
      expect(tableData.pages).toEqual([1, 2, 3, 4]);
      expect(tableData.size()).toEqual(4*40);
      tableData.loadPageAtTop();
      //expect(tableData.pages).toEqual([0, 1, 2, 3]);
      expect(tableData.size()).toEqual(4*40);


    });

    it("should set page 0 when order is changed", function() {
      tableData.options.attributes.page = 10;
      tableData.setOptions({
        mode: 'desc'
      });
      expect(tableData.options.get('page')).toEqual(0);
      // if the page is set keep the value
      tableData.setOptions({
        mode: 'desc',
        page: 8
      });
      expect(tableData.options.get('page')).toEqual(8);
    });

    it("should be able to fetch the georeference status", function() {
      table.fetchGeoreferenceStatus();
      expect(cartodb.SQLMock.getState().executeCount).toEqual(1)
    })


    it("should detect if the_geom is present", function() {
      table.set({name: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number'],
          ['the_geom', 'geometry']
        ],
      })
      expect(table.hasTheGeom()).toBeTruthy();
    })

    it("should get the histogram", function() {
      var data = {
        upper: 1,
        lower: -1,
        buckets: [],
        val: []
      }

      for(var i = 0; i < 10; ++i) {
        data.buckets.push(i);
        data.val.push(Math.sin(i)*100);
      }
      //data.buckets = '{' + data.buckets.join(',') + '}'
      //data.val = '{' + data.val.join(',') + '}'
      sinon.stub(table.data(), '_sqlQuery').yields({ rows: [data]});
      table.data().histogram(10, 'column', function(hist, bounds) {

        expect(hist.length).toEqual(10);
        expect(_.max(hist)).toEqual(1.0);

        expect(bounds.upper).toEqual(1);
        expect(bounds.lower).toEqual(-1);
      });
    });

    it("should get the discrete histogram", function() {

      var rows = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];

      var NBUCKETS = 10;
      var ORIGINAL_ARRAY_LENGTH = rows.length;

      sinon.stub(table.data(), '_sqlQuery').yields({ rows: rows });

      table.data().discreteHistogram(NBUCKETS, 'column', function(data) {
        expect(data.reached_limit).toBeTruthy();
        expect(data.rows.length).toEqual(NBUCKETS);
      });

    });


  });

  var wkbPoint = '0101000020110F00004E3CE77C32B324418662B3BD88715841'
  var wkbPolygon = '0106000020E61000000100000001030000000100000016000000000000C0D4211740000000A07DC34840000000C0285C1740000000E0AEC6484000000000BF98174000000060D5D44840000000A03F48174000000020E4DF48400000000096FC164000000060CBE54840000000C06903174000000000B1EC484000000060A8EC16400000008073F2484000000060BB3B17400000006005FB48400000000065471740000000203E0149400000002085EB1740000000000B16494000000080826D1840000000207915494000000040FF861840000000601110494000000040138F18400000004092FF484000000080814E1940000000A07BEB484000000060C1161A4000000020D2E74840000000E0CE0A1A40000000A06ADA484000000060707D1940000000A08DCB484000000000EA721940000000A0E0BA4840000000603EA91840000000609AC0484000000000F1EC17400000008062B948400000000074DA17400000004081BE4840000000C0D4211740000000A07DC34840';

  describe("cbd.admin.SQLViewData", function() {

    var sqlView;

    beforeEach(function() {
      sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
    });

    it("default order should be empty after set sql", function() {
      sqlView.setSQL('select * from table'),
      expect(sqlView.options.get('order_by')).toEqual('');
      expect(sqlView.options.get('sort_order')).toEqual('asc');
      expect(sqlView.options.get('filter_column')).toEqual('');
      expect(sqlView.options.get('filter_value')).toEqual('');
      expect(sqlView.options.get('page')).toEqual(0);
    });

    it("should guess geometry type", function() {
      sqlView.reset({ the_geom: wkbPoint});
      expect(sqlView.getGeometryTypes()).toEqual(['ST_Point']);

      sqlView.reset({ the_geom: wkbPolygon});
      expect(sqlView.getGeometryTypes()).toEqual(['ST_Multipolygon']);

      sqlView.reset({ the_geom_webmercator: wkbPoint});
      expect(sqlView.getGeometryTypes()).toEqual(['ST_Point']);

      sqlView.reset({ the_geom_webmercator: wkbPolygon});
      expect(sqlView.getGeometryTypes()).toEqual(['ST_Multipolygon']);

      // precedence
      sqlView.reset({ the_geom: wkbPolygon, the_geom_webmercator: wkbPoint});
      expect(sqlView.getGeometryTypes()).toEqual( ['ST_Multipolygon']);

      sqlView.reset([
        { the_geom: null},
        { the_geom: null},
        null,
        { the_geom: wkbPoint},
        { the_geom: null}
      ]);
      expect(sqlView.getGeometryTypes()).toEqual(['ST_Point']);

    });

    it("should return true if has georeferenced data", function() {
      sqlView.reset([
        {the_geom: '{"type":"Point","coordinates":[-5.84198,43.648001]}'}
      ]);
      expect(sqlView.isGeoreferenced()).toEqual(true);
    });

    it("should return false if hasn't any georeferenced data", function() {
      sqlView.reset([
        {r : 1}
      ]);
      expect(sqlView.isGeoreferenced()).toEqual(false);
    });

    it("should raise change:sql always", function() {
      var c = 0;
      sqlView.options.bind('change:sql', function() {
        ++c;
      });
      sqlView.setSQL('select * from test');
      sqlView.setSQL('select * from test');
      sqlView.setSQL('select * from test2');
      expect(c).toEqual(3);
    });

    it("should not set null sql", function() {
      sqlView.setSQL(null);
      expect(sqlView.options.get('sql')).toEqual('');
    });

    it("should replace variables like {x},{y},{z} by a 0", function() {
      sqlView.setSQL('select {x}, {y}, {z} as aaa from table');
      expect(sqlView.options.get('sql')).toEqual('select 0, 0, 0 as aaa from table');
      sqlView.setSQL('select \\{x} as aaa from table');
      expect(sqlView.options.get('sql')).toEqual('select {x} as aaa from table');
    });

    it("should be read only when a filter has been applied", function() {
      sqlView.setSQL('select {x}, {y}, {z} as aaa from table');
      expect(sqlView.isReadOnly()).toBeTruthy();

      sqlView.options.set('sql_source', 'filters');

      expect(sqlView.isReadOnly()).toBeFalsy();
    });

    it("should reset rows when fails", function() {
      sqlView.reset([{a: 1, b:2}])
      expect(sqlView.size()).toEqual(1);
      var spy = sinon.spy()
      sqlView.bind('reset', spy)
      sqlView.trigger('error')
      expect(spy.called).toEqual(true);
      expect(sqlView.size()).toEqual(0);
    });

    it("fech should use POST when the query is longer than 1024 bytes", function() {
      spyOn(sqlView, '_sqlQuery')
      var sql = 'select * from table limit '
      while(sql.length < 1024 + 1) {
        sql += '0';
      }
      sqlView.setSQL(sql)
      sqlView.fetch();
      expect(sqlView._sqlQuery.calls.argsFor(0)[3]).toEqual('POST');
    });

    it("write queries should not fetch metadata", function() {
      sqlView.url = 'test'
      spyOn(sqlView, '_sqlQuery')
      sqlView.setSQL('update table set a = 1')
      sqlView.fetch();
      expect(sqlView._sqlQuery).not.toHaveBeenCalled();
      sqlView.setSQL('select * from table')
      sqlView.fetch();
      expect(sqlView._sqlQuery).toHaveBeenCalled();
    });

    it("write queries should use post", function() {
      spyOn(Backbone, 'sync');
      sqlView.setSQL('update table set a = 1')
      sqlView.sync();
      expect(Backbone.sync.calls.argsFor(0)[2].type).toEqual('POST');
    });

    it("should explicitly add 'as' to aliases", function(){
      spyOn(sqlView, '_sqlQuery')
      sqlView.setSQL("SELECT the_geom as location FROM testTable");
      sqlView.fetch();
      // expect(sqlView._sqlQuery).toHaveBeenCalled();
      // expect(sqlView._sqlQuery).toHaveBeenCalledWith("select * from (SELECT the_geom as location FROM testTable) __wrapped limit 0", Function, Function, 'GET');
      expect(sqlView._sqlQuery.calls.mostRecent().args[0]).toEqual("select * from (SELECT the_geom as location FROM testTable) __wrapped limit 0", Function, Function, 'GET');
      // expect(sqlView._sqlQuery).toEqual;
    });

  });

});
