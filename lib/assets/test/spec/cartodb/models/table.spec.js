
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

    });

    it("hasgeomtype", function() {
      var r = new cdb.admin.Row({
        cartodb_id: 100,
        the_geom: JSON.stringify({ type: 'point', coordinates: [2,1] })
      });
      expect(r.hasGeometry()).toEqual(true);
      r.set('the_geom', JSON.stringify({ type: 'point', coordinates: null }));
      expect(r.hasGeometry()).toEqual(false);
      r.set('the_geom', null);
      expect(r.hasGeometry()).toEqual(false);
      r.set('the_geom', undefined);
      expect(r.hasGeometry()).toEqual(false);

    });

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


    xit("when a row is saved should update geom types", function() {
      table.data().create = function(a, o) {
        o.success();
      }
      var r = new cdb.admin.Row({
        cartodb_id: 100,
        the_geom: JSON.stringify({ type: 'point', coordinates: [2,1] })
      });
      table.data().add(r);
      expect(table.geomColumnTypes()).toEqual(['point']);
      var r = new cdb.admin.Row({
        cartodb_id: 101,
        the_geom: JSON.stringify({ type: 'linestring', coordinates: [2,1] })
      });
      table.data().add(r);
      expect(table.geomColumnTypes()).toEqual(['point', 'line']);
      var r = new cdb.admin.Row({
        cartodb_id: 102,
        the_geom: JSON.stringify({ type: 'multipolygon', coordinates: [2,1] })
      });
      table.data().add(r);
      expect(table.geomColumnTypes()).toEqual(['point', 'line', 'polygon']);
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

    it("isGeoreferenced", function() {
      var r = new cdb.admin.Row({
        cartodb_id: 100,
        the_geom: JSON.stringify({ type: 'point', coordinates: [2,1] })
      });
      table.set({geometry_types: ['ST_MultiPolygon']});
      expect(table.isGeoreferenced()).toEqual(true);
      table.set({geometry_types: []});
      expect(table.isGeoreferenced()).toEqual(false);
      table.data().add(r);
      expect(table.isGeoreferenced()).toEqual(true);
    });

    it("should change schema when a sqlview is applied", function() {
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      table.useSQLView(sqlView);
      sqlView.reset([
        { a: 1, b:2 }
      ]);

      expect(table.get('schema')).toEqual([
        ['a', 'undefined'],
        ['b', 'undefined']
      ]);
      /*expect(table._data.models[0].attributes).toEqual(
        { a: 1, b:2 }
      );*/
      //spyOn(table._data, 'fetch');
      //expect(table._data.fetch).toHaveBeenCalled();
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

/*
    it("should fecth the table metadata when the sql applied modifies the table", function() {
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      table.useSQLView(sqlView);
      spyOn(table, 'fetch');
      sqlView.modify_rows = true;
      sqlView.reset([
        { a: 1, b:2 }
      ]);
      expect(table.fetch).not.toHaveBeenCalled();
    });
    */

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
      table.trigger('columnRename', 'test', 'tt');
      expect(info.containsField('test')).toEqual(false);
      expect(info.containsField('tt')).toEqual(true);
      table.trigger('columnRename', 'tt');
      expect(info.containsField('tt')).toEqual(false);
    });

    it("should restore the infowindow fields after clear a sql view", function() {
      info = new cdb.geo.ui.InfowindowModel();
      info.addField('test')
      table.linkToInfowindow(info);
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      table.useSQLView(sqlView);
      sqlView.reset([
        { a: 1, b:2 }
      ]);
      spyOn(table, 'fetch');
      expect(sqlView.table).toEqual(table);
      expect(info.containsField('a')).toEqual(true);
      expect(info.containsField('b')).toEqual(true);
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


    it("should be able to link to infowindow ignoring hidden columns", function() {
      info = new cdb.geo.ui.InfowindowModel();
      table.linkToInfowindow(info);
      var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
      table.useSQLView(sqlView);
      sqlView.reset([
        { the_geom: 1, the_geom_webmercator:2, created_at: 3, updated_at: 4, control: 5 }
      ]);
      expect(info.containsField('control')).toBeTruthy();
      expect(info.containsField('the_geom_webmercator')).toBeFalsy();
      expect(info.containsField('created_at')).toBeFalsy();
      expect(info.containsField('updated_at')).toBeFalsy();
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
      expect(tableData.pages).toEqual([0, 1, 2, 3]);
      expect(tableData.size()).toEqual(4*40);

      rows_to_return = 30;
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
      expect(cartodb.SQLMock.getState().executeArgs.sql).toEqual('WITH q as (select * from a) SELECT count(*) FROM q WHERE the_geom is not null')
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
      expect(cartodb.SQLMock.getState().executeArgs.sql).toEqual('SELECT count(*) FROM testTable WHERE the_geom is not null')
    })

    it("should return false if there's not a the_geom column", function() {
      var geo = null;
      table.fetchGeoreferenceQueryStatus().done(function(res){
        geo = res;
      });
      expect(geo).toBe(false);
    })


  });

  describe("cbd.admin.SQLViewData", function() {

    var sqlView;

    beforeEach(function() {
      sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a' });
    });

    it("should generate schema from data", function() {
      expect(sqlView.schemaFromData()).toEqual([]);
      sqlView.reset([
        {a: 1, b: 2}
      ]);
      expect(sqlView.schemaFromData()).toEqual([
        ['a', 'undefined'],
        ['b', 'undefined']
      ]);

      expect(sqlView.schemaFromData([['a', 'number']])).toEqual([
        ['a', 'number'],
        ['b', 'undefined']
      ]);

    });

    it("should return true if has georeferenced data", function() {
      sqlView.reset([
        {the_geom_webmercator: 1}
      ]);
      expect(sqlView.isGeoreferenced()).toEqual(true);
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
      expect(models.tables.length).toEqual(cdb.admin.Tables.prototype._TABLES_PER_PAGE);

    })

    it("should be able to refill the table list when needed", function() {
      tables.fetch();
      this.server.respond();
      var model = tables.models[cdb.admin.Tables.prototype._TABLES_PER_PAGE -1];
      tables.remove(model);

      tables.refillTableList(cdb.admin.Tables.prototype._TABLES_PER_PAGE);
      this.server.respond();
      expect(tables.models.length).toEqual(cdb.admin.Tables.prototype._TABLES_PER_PAGE);
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

  });

});
