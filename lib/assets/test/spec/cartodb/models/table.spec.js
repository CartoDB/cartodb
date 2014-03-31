
describe("admin table", function() {

  describe("cbd.admin.Column", function() {
      var column;
      beforeEach(function() {
        var table = new cdb.admin.CartoDBTableMetadata({
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
        name: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number']
        ]
      });
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
          ['test2', 'number'],
          ['the_geom', 'number'],
          ['updated_at', 'number'],
          ['cartodb_id', 'number']
        ]
      });
      var s = sinon.spy();
      table.bind('change:schema', s);
      table.sortSchema();
      expect(table.get('schema')).toEqual([
          ['cartodb_id', 'number'],
          ['the_geom', 'number'],
          ['test2', 'number'],
          ['updated_at', 'number']
        ]
      );
      expect(s.called).toEqual(true);
    });

    it("should not override geometry_types and schema when in sqlView", function() {
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      table.useSQLView(sqlView);
      var parsed = table.parse({
        name: 'test_2',
        schema: [ ['a', 'number'] ],
        geometry_types: ['test']
      })
      expect(parsed.name).toEqual('test_2');
      expect(parsed.schema).toEqual(undefined);
      expect(parsed.geometry_types).toEqual(undefined);

      table.useSQLView(null);
      parsed = table.parse({
        name: 'test_2',
        schema: [ ['a', 'number'] ],
        geometry_types: ['test']
      })
      expect(parsed.name).toEqual('test_2');
      expect(parsed.schema).toEqual([ ['a', 'number'] ]);
      expect(parsed.geometry_types).toEqual(['test']);

    });

    it("should copy the types of the original schema" ,function() {
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });

      table.useSQLView(sqlView);
      sqlView.query_schema = [
        ['test', 'string'],
        ['test3', 'number']
      ]
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
      expect(table.alterTable('select * from blba')).toEqual(false);
      expect(table.alterTable('alter table add column blbla')).toEqual(true);
      expect(table.alterTable('update aaa set a = 1')).toEqual(false);
      expect(table.alterTable('insert into blaba values (1,2,3,4)')).toEqual(false);
      expect(table.alterTable('delete from bkna')).toEqual(false);
    });

    it("altertabledata", function() {
      expect(table.alterTableData('select * from blba')).toEqual(false);
      expect(table.alterTableData('update aaa set a = 1')).toEqual(true);
      expect(table.alterTableData('update  __rabos123123     set a = 1')).toEqual(true);
      expect(table.alterTableData('alter table add column blbla')).toEqual(true);
      expect(table.alterTableData('insert into blaba values (1,2,3,4)')).toEqual(true);
      expect(table.alterTableData('insert    into blaba values (1,2,3,4)')).toEqual(true);
      expect(table.alterTableData('delete from bkna')).toEqual(true);
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
      table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
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
      expect(args[0]).toEqual('SELECT * ,ST_AsGeoJSON(the_geom, 8) as the_geom  from (select * from test) _table_sql WHERE cartodb_id = 100')

    });

    it("row should not fetch the geom when no_geom is passed", function() {
      table = TestUtil.createTable('test', [['the_geom', 'geometry']]);
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
      expect(args[0]).toEqual('SELECT *  from (select * from test) _table_sql WHERE cartodb_id = 100')

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
      spyOn(table, 'fetch');
      expect(sqlView.table).toEqual(table);
      table.useSQLView(null);
      expect(table.fetch).toHaveBeenCalled();
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
        spyOn(table, 'fetch')
        r.trigger('saved');
        expect(table.fetch).toHaveBeenCalled();
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

      sqlView.query_schema = [
        ['a', 'string'],
        ['b', 'number']
      ]
      sqlView.reset([ { a: 1, b:2 } ]);
      info.addField('a').addField('b');

      // apply different sql view
      sqlView.query_schema = [
        ['c', 'string'],
        ['d', 'number']
      ]
      sqlView.reset([ { c: 1, d:2 } ]);
      info.addField('c').addField('d');

      // apply the first one again
      sqlView.query_schema = [
        ['b', 'number'],
        ['a', 'string']
      ];
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
      sqlView.query_schema = [
        ['test', 'string'],
        ['b', 'number']
      ]
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
      table.addColumn('irrelevant1', 'string', function() {
        succeded = true;
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
      table.deleteColumn('test');
      server.respond();
      expect(succeded).toBeTruthy();
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
      table.renameColumn('test', 'irrelevant');
      server.respond();
      expect(succeded).toBeTruthy();
    })

    it("should be able to say if a type change is destructive", function() {
      expect(table.isTypeChangeDestructive("test2","string")).toBeFalsy();
      expect(table.isTypeChangeDestructive("test","number")).toBeTruthy();

    })

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
      table.changeColumnType('test2', 'string');
      server.respond();
      expect(succeded).toBeTruthy();
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
      table.set('schema', [['test', 'number']]);
      expect(table._data.fetch).toHaveBeenCalled()
    });

  });

  describe("cbd.admin.Tables", function() {
    var tables;

    beforeEach(function() {
      tables = new cdb.admin.Tables();
    });

    it("the model should be Table", function() {
      expect(tables.model).toEqual(cdb.admin.CartoDBTableMetadata);
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

    it("url should include sql query", function() {
      table.set({
        name: 'testTable',
        id: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number'],
          ['the_geom', 'geometry'],
          ['the_geom_webmercator', 'geometry']
        ],
      })
      var the_geom = ["CASE",
        "WHEN GeometryType(the_geom) = 'POINT' THEN",
          "ST_AsGeoJSON(the_geom,8)",
        "WHEN (the_geom IS NULL) THEN",
          "NULL",
        "ELSE",
          "'GeoJSON'",
        "END the_geom"].join(' ')
      var sql = "select \"test\",\"test2\","+ the_geom +" from testTable order by cartodb_id asc"
      expect(tableData.url().indexOf(encodeURIComponent(sql))).not.toEqual(-1);
      expect(tableData.url().indexOf("the_geom_webmercator")).toEqual(-1);

      table.set({name: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number'],
          ['the_geom_webmercator', 'geometry']
        ]
      })
      var sql = "select \"test\",\"test2\" from testTable order by cartodb_id asc";
      expect(tableData.url().indexOf(encodeURIComponent(sql))).not.toEqual(-1);
      expect(tableData.url().indexOf("the_geom_webmercator")).toEqual(-1);

      tableData.options.set('mode', 'des')
      tableData.options.set('order_by', 'test')

      sql = "select \"test\",\"test2\" from testTable order by test desc";
      expect(tableData.url().indexOf(encodeURIComponent(sql))).not.toEqual(-1);

    })

    it("should add params to the url", function() {
      expect(tableData.url().indexOf('rows_per_page=40')).not.toEqual(-1);
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

      /*rows_to_return = 30;
      tableData.loadPageAtBottom();
      expect(tableData.pages).toEqual([1, 2, 3, 4]);
      expect(tableData.size()).toEqual(3*40 + rows_to_return);
      expect(tableData.lastPage).toEqual(true);

      // load again
      tableData.loadPageAtBottom();
      expect(tableData.pages).toEqual([1, 2, 3, 4]);
      expect(tableData.size()).toEqual(3*40 + rows_to_return);
      expect(tableData.lastPage).toEqual(true);

      rows_to_return = 40;
      tableData.loadPageAtTop();
      expect(tableData.pages).toEqual([0, 1, 2, 3]);
      expect(tableData.size()).toEqual(4*40);
      expect(tableData.lastPage).toEqual(false);
      */

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

    it("fetchGeoreferenceQueryStatus should resolve with false when the query fails", function() {
      var res = null;
      table.fetchGeoreferenceQueryStatus().done(function(r) {
        res = r;
      })
      cartodb.SQLMock.getPromise().error();
      expect(res).toEqual(false);
    });

    it("should detect if the_geom is not present", function() {
      expect(table.hasTheGeom()).toBeFalsy();
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

    it("should fetch a for georeference content if there's a query applied", function() {

      sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      table.sqlView = sqlView;
      table.set({name: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number'],
          ['the_geom', 'geometry']
        ],
      })

      table.fetchGeoreferenceQueryStatus();
      expect(cartodb.SQLMock.getState().executeArgs.sql).toEqual('SELECT the_geom FROM ( select * from a) as q WHERE q.the_geom is not null LIMIT 1')
    })

    it("should fetch a for georeference content if there's not a query applied", function() {
      table.set({name: 'testTable',
        schema: [
          ['test', 'string'],
          ['test2', 'number'],
          ['the_geom', 'geometry']
        ],
      })
      table.fetchGeoreferenceQueryStatus();
      expect(cartodb.SQLMock.getState().executeArgs.sql).toEqual('SELECT the_geom FROM testTable WHERE the_geom is not null LIMIT 1')
    })

    it("should check if the_geom is not present", function() {
      var geo = null;
      var c =cartodb.SQLMock.getState().executeCount;
      table.fetchGeoreferenceQueryStatus().done(function(res){
        geo = res;
      });
      expect(cartodb.SQLMock.getState().executeCount).toEqual(c + 1)
    })

    it("should add lat and lon to the_geom if georeferenced by column", function() {
      // this test is dumb as hell, since all the heavy work is done on server
      var saved = false,
        notified = false;
      table = new cdb.admin.CartoDBTableMetadata({
        name: 'testTable',
        schema: [
          ['test', 'string'],
          ['lat', 'number'],
          ['lon', 'number']
        ],
      });
      table.data().reset({'test':'test', 'lat':1, 'lon':1})
      table.bind('geolocated', function() {
        notified = true;
      })
      var params;
      var opt;
      table.save = function(a,b){params = a;saved = true; opt = b;b.success()};
      table.data().fetch = function() {};
      table.geocodeLatAndLng('lat','lon');
      expect(params).toEqual({
        latitude_column: 'lat',
        longitude_column: 'lon',
      })
      expect(opt.silent).toEqual(undefined);

      expect(saved).toBeTruthy();
      expect(notified).toBeTruthy();
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
      expect(sqlView.options.get('mode')).toEqual('asc');
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

    it("sql should be read only by default", function() {
      sqlView.setSQL('select {x}, {y}, {z} as aaa from table');
      expect(sqlView.isReadOnly()).toEqual(true);
    });

    it("filter column should be rw", function() {
      sqlView.filterColumn('test', 'testtable', 'pattern');
      expect(sqlView.isReadOnly()).toEqual(false);
    });

    it("filter sql should be different if the colum is number type", function() {
      expect(sqlView.filterColumnSQL('test', 'tableName', 'jaja')).toEqual(
        "SELECT * from tableName where test ilike '%jaja%'"
      );

      expect(sqlView.filterColumnSQL('test', 'tableName', 1, 'number')).toEqual(
        "SELECT * from tableName where test = 1"
      );

      expect(sqlView.filterColumnSQL('test', 'tableName', "rabo", 'boolean')).toEqual(
        "SELECT * from tableName where test = false"
      );
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

  });

  describe("cbd.admin.SQLViewDataAPI", function() {
    var sqlView;

    beforeEach(function() {
      sqlView = new cdb.admin.SQLViewDataAPI(null, { sql: 'select * from a' });
    });

    it("should use get to get params", function() {
      var opt, m;
      var s = Backbone.sync;
      Backbone.sync = function(method, model, options) {
        opt = options;
        m = method;
      }
      sqlView.fetch();
      expect(m).toEqual("read");
      expect(opt.data).toEqual(undefined);
      Backbone.sync = s;
    });
  });


  describe("Tables", function() {
    var tables;
    var fakeModel = function(id) {
      return {id: id, name: 'test'+id, privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'};
    }
    beforeEach(function() {
      tables = new cdb.admin.Tables();
      tables.url = function(){ return 'irrelevant.json'};

      this.server = sinon.fakeServer.create();

      var tableArray = [];
      for(var i = 0; i < tables.options.get('per_page'); i++) {
        tableArray.push(fakeModel(i));
      }
      this.server.respondWith("GET", "irrelevant.json",
                                  [200, { "Content-Type": "application/json" },
                                   '{"total_entries":12, "tables": '+JSON.stringify(tableArray)+'}']);
      this.server.respondWith("PUT", "irrelevant.json",
                                  [200, { "Content-Type": "application/json" },
                                   JSON.stringify(fakeModel(1))]);
      this.server.respondWith("POST", "irrelevant.json",
                                  [200, { "Content-Type": "application/json" },
                                   JSON.stringify(fakeModel(1))]);
      this.server.respondWith("GET", "irrelevantError.json",
                                  [500, { "Content-Type": "application/json" },
                                   '{"total_entries":12, "tables": '+JSON.stringify(tableArray)+'}']);

    });

    afterEach(function() {
      this.server.restore();
    })

    it("should fetch when request a page", function() {
      spyOn(tables, 'fetch');
      tables.options.set({page:2});
      expect(tables.fetch).toHaveBeenCalled();
    });

    it("should know the number of pages", function() {
      tables.total_entries = 22;
      expect(tables.getTotalPages()).toEqual(2);
    });

    it("should be able to fetch the tables without setting them in the model", function() {
      var n = tables.models.length;
      tables.fetchButNotSet();
      this.server.respond();

      expect(tables.models.length).toEqual(n);
    })

    it("should trigger the loading event when fetch", function() {
      var triggered = false;
      tables.bind('loading', function() {
        triggered = true;
      });
      tables.fetch();
      expect(triggered).toBeTruthy();
    })

    it("should not trigger the loaded event before server responds", function() {
      var triggered = false;
      tables.bind('loaded', function() {
        triggered = true;
      });
      tables.fetch();
      expect(triggered).toBeFalsy();
    })

    it("should trigger the loaded event after server responds", function() {
      var triggered = false;
      tables.bind('loaded', function() {
        triggered = true;
      });
      tables.fetch();
      this.server.respond();
      expect(triggered).toBeTruthy();
    })

    it("should  not trigger the loadFailed event if everything goes ok", function() {
      var triggered = false;
      tables.bind('loadFailed', function() {
        triggered = true;
      });
      tables.fetch();
      this.server.respond();
      expect(triggered).toBeFalsy();
    })

    it("should trigger the loadFailed event if there's an error", function() {
      var triggered = false;
      tables.url = function() {return 'irrelevantError.json'}
      tables.bind('loadFailed', function() {
        triggered = true;
      });
      tables.fetch();
      this.server.respond();
      expect(triggered).toBeTruthy();
    })

    it("should be able to retrieve server info without setting it in the model", function() {
      var models = {};
      $.when(tables.fetchButNotSet()).done(function(res) {
        models = res;
      });
      this.server.respond();

      expect(models.tables).toBeTruthy();
      expect(models.tables.length).toEqual(cdb.admin.Tables.prototype._ITEMS_PER_PAGE);

    })

    it("should be able to refill the table list when needed", function() {
      tables.fetch();
      this.server.respond();
      var model = tables.models[cdb.admin.Tables.prototype._ITEMS_PER_PAGE -1];
      tables.remove(model);

      tables.refillTableList(cdb.admin.Tables.prototype._ITEMS_PER_PAGE);
      this.server.respond();
      expect(tables.models.length).toEqual(cdb.admin.Tables.prototype._ITEMS_PER_PAGE);
    })


    it("should trigger forceReload event when options change", function() {
      var triggered = false;

      tables.bind('forceReload', function() {
        triggered = true;
      })
      tables.options.set("test", true);

      this.server.respond();
      expect(triggered).toBeTruthy();
    })

    it("should calculate the total pages", function() {
      tables.fetch();
      this.server.respond();
      expect(tables.getTotalPages()).toEqual(1);

    })

    it("should define a number of ITEMS_PER_PAGE", function() {
      expect(cdb.admin.Tables.prototype._ITEMS_PER_PAGE).toBeDefined();
    })

    it("should define a number of PREVIEW_ITEMS_PER_PAGE", function() {
      expect(cdb.admin.Tables.prototype._PREVIEW_ITEMS_PER_PAGE).toBeDefined();
    })

  });

});
