
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
      expect(table.alterTableData('alter table add column blbla')).toEqual(true);
      expect(table.alterTableData('insert into blaba values (1,2,3,4)')).toEqual(true);
      expect(table.alterTableData('delete from bkna')).toEqual(true);
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
      table.addColumn('irrelevant1', 'string', function() {
        succeded = true;
      })
      server.respond();
      expect(succeded).toBeTruthy();
    })

    it("should remove a column", function() {
      var server = sinon.fakeServer.create();
      server.respondWith("DELETE", "/api/v1/tables/" + table.get('name') + "/columns/test",
        [200, { "Content-Type": "application/json" },
       '{"name":"irrelevant1","type":"text","cartodb_type":"string"}']);
      var succeded = false;
      table.bind('columnDelete', function() {
        succeded = true;
      }
      table.deleteColumn('test');
      server.respond();
      expect(succeded).toBeTruthy();
    })

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
        ]
      });

      tableData = new cdb.admin.CartoDBTableData(null, {
        table: table
      });
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
  });


  describe("Tables", function() {
    var tables;
    var fakeModel = function(id) {
      return {id: id, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test'};
    }
    beforeEach(function() {
      tables = new cdb.admin.Tables();
      tables.url = function(){ return 'irrelevant.json'};

      this.server = sinon.fakeServer.create();

      var tableArray = [];
      for(var i = 0; i < 10; i++) {
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
      expect(tables.getTotalPages()).toEqual(3);
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
      expect(models.tables.length).toEqual(10);

    })

    it("should be able to refill the table list when needed", function() {
      tables.fetch();
      this.server.respond();
      var model = tables.models[9];
      tables.remove(model);

      tables.refillTableList(10);
      this.server.respond();
      expect(tables.models.length).toEqual(10);
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

      expect(tables.getTotalPages()).toEqual(2);

    })

  });

});
