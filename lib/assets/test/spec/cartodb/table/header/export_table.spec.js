var fetchResponse;
describe("Export table", function() {
  var export_dialog, sqlView, table;
  beforeEach(function() {
    var schema = [
      ['test', 'number'],
      ['test2', 'string'],
      ['the_geom', 'geometry'],
    ]
    table = TestUtil.createTable('test', schema);
    fetchResponse = true;
    table.fetchGeoreferenceQueryStatus = function() {
      return {
        done: function(f) {
          f(fetchResponse);
          return {
            fail: function() {}
          }
        }
      }
    }

    this.config = {
      "sql_api_protocol":"http",
      "sql_api_domain":"admin.localhost.lan",
      "sql_api_endpoint":"/api/v1/sql",
      "sql_api_port":8080
    };
    this.user_data = {
      api_key: 'ciruelo_big_key'
    };
    export_dialog = new cdb.admin.ExportTableDialog({
      model: table,
      config: this.config,
      user_data: this.user_data
    });
    export_dialog.submit = function() {
      this.submited = true;
      this.dataSubmited = this.$('form').serializeArray();
    }
    export_dialog.baseUrl = 'dummy'
    export_dialog._MAX_SQL_GET_LENGTH = 1;
    this.server = sinon.fakeServer.create();
    this.server.respondWith("POST", "dummy",
                                [200, { "Content-Type": "application/json" },
                                 '{ "response": true }']);
    this.server.respondWith("GET", "dummy",
                                [500, { "Content-Type": "application/json" },
                                 '{ "response": false }']);
  });

  afterEach(function(){
    this.server.restore();
  })

  it("should open the export dialog", function() {
    export_dialog.render();
    expect(export_dialog.$el.find(".modal:eq(0) div.head h3").text()).toEqual('Select your file type');
    expect(export_dialog.$el.find(".modal:eq(0) nav a").size()).toEqual(5);
  });

  it("should create the form", function() {
    export_dialog.render();
    expect(export_dialog.$el.find('form').attr('action')).toEqual('dummy');
  })

  it("should submit the form when clicked and the sql is bigger than _MAX_SQL_GET_LENGTH", function() {
    export_dialog.render();
    export_dialog.$el.find('*[data-format="csv"]').click();
    expect(export_dialog.submited).toBeTruthy();
  })

  it("should set the filename of the exported file and make it equal to the table's name in th sqlView", function() {
    table.sqlView = true;

    export_dialog.render();
    var options = export_dialog.getBaseOptions();
    expect(options.filename).toEqual(table.get("name"));
  })

  it("should not submit the form when clicked and the sql is bigger than _MAX_SQL_GET_LENGTH", function() {
    export_dialog._MAX_SQL_GET_LENGTH = 99999;
    export_dialog.render();
    var called = false;
    export_dialog._fetchGET = function(){called = true};
    export_dialog.$el.find('*[data-format="csv"]').click();
    expect(export_dialog.submited).toBeFalsy();
  })

  it("should fetch by get when sql is less than _MAX_SQL_GET_LENGTH", function() {
    export_dialog._MAX_SQL_GET_LENGTH = 99999;
    export_dialog.render();
    var called = false;
    export_dialog._fetchGET = function(){called = true};
    export_dialog.$el.find('*[data-format="csv"]').click();
    expect(called).toBeTruthy();
  })

  it("should pass the correct parameters when csv is clicked", function() {
    export_dialog.render();
    export_dialog.$el.find('*[data-format="csv"]').click();
    var submitedData = {};
    for(var i in export_dialog.dataSubmited) {
      var obj = export_dialog.dataSubmited[i];
      submitedData[obj.name] = obj.value;
    }

    expect(submitedData['skipfields']).toEqual('the_geom_webmercator');
    expect(submitedData['dp']).toEqual(undefined);
  })

  it("should pass the correct parameters when svg is clicked", function() {
    export_dialog.render();
    export_dialog.$el.find('*[data-format="svg"]').click();
    var submitedData = {};
    for(var i in export_dialog.dataSubmited) {
      var obj = export_dialog.dataSubmited[i];
      submitedData[obj.name] = obj.value;
    }

    expect(submitedData['skipfields']).toEqual(undefined);
    expect(submitedData['dp']).toEqual(undefined);
  })

  it("should pass the correct parameters when geoJson is clicked", function() {
    export_dialog.render();
    export_dialog.$el.find('*[data-format="geojson"]').click();
    var submitedData = {};
    for(var i in export_dialog.dataSubmited) {
      var obj = export_dialog.dataSubmited[i];
      submitedData[obj.name] = obj.value;
    }

    expect(submitedData['skipfields']).toEqual(undefined);
    expect(submitedData['dp']).toEqual(undefined);
  })

  it("should return correct geoformat obj", function() {
    var geo = export_dialog.formats[2];
    var geo2 = export_dialog.getFormat(geo.format);
    expect(_.isEqual(geo, geo2)).toBeTruthy();
  })

  it("should call csv fetcher when csv is clicked", function() {
    export_dialog.render();
    spyOn(export_dialog, 'fetchCSV');
    export_dialog.$el.find('*[data-format="csv"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetchCSV).toHaveBeenCalled();
  })

  it("should call svg fetcher when svg is clicked", function() {
    export_dialog.render();
    spyOn(export_dialog, 'fetchSVG');
    export_dialog.$el.find('*[data-format="svg"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetchSVG).toHaveBeenCalled();
  })

  it("should call plain fetcher when geoJson is clicked", function() {
    export_dialog.render();
    spyOn(export_dialog, 'fetch');
    export_dialog.$el.find('*[data-format="geojson"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetch).toHaveBeenCalled();
  })

  it("should detect if the table is georeferenced and refresh", function() {
    var called = false;

    export_dialog.refresh = function() { called = true;}
    table.set('geometry_types', ['st_point']);
    expect(called).toBeTruthy();
  })

  it("should not show a warning if the table is georeferenced", function() {
    export_dialog.render();
    expect(export_dialog.$('.geospatial').is('.hidden')).toBeTruthy();;
  })

  it("should not show generation warning when rendered", function() {
    export_dialog.render();
    expect(export_dialog.$('.generating').is(':visible')).toBeFalsy();;
  })

  it("should show a warning after click", function() {
    export_dialog.render();
    export_dialog.$el.find('*[data-format="svg"]').click();
    this.server.respond();

    expect(export_dialog.$('.generating').is(':visible')).toBeFalsy();;
  })

  it("should not show a warning if the table is NOT georeferenced after a click", function() {
    table.set("schema", ['dubidubidua', 'string']);
    export_dialog.render();
    export_dialog.$el.find('*[data-format="svg"]').click();
    expect(export_dialog.$('.geospatial').is(':visible')).toBeFalsy();;
  })

  it("should not call svg fetcher if there are not the_geom", function() {
    fetchResponse  = false;
    table.set('geometry_types', []);
    sinon.spy(export_dialog, 'fetchSVG');
    export_dialog.$el.find('*[data-format="svg"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetchSVG.calledOnce).toBeFalsy();
    export_dialog.fetchSVG.restore();
  })

  it("should not call geojson fetcher if there are not the_geom", function() {
    table.set("schema", ['dubidubidua', 'string']);
    table.set('geometry_types', []);
    sinon.spy(export_dialog, 'fetch');
    export_dialog.$el.find('*[data-format="geojson"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetch.calledOnce).toBeFalsy();
    export_dialog.fetch.restore();
  })

  it("should not call shp fetcher if there are not the_geom", function() {
    table.set("schema", ['dubidubidua', 'string']);
    table.set('geometry_types', []);
    sinon.spy(export_dialog, 'fetch');
    export_dialog.$el.find('*[data-format="shp"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetch.calledOnce).toBeFalsy();
    export_dialog.fetch.restore();
  })

  it("should call csv fetcher when csv is clicked even if there's not the_geom", function() {
    table.set("schema", ['dubidubidua', 'string']);
    export_dialog.render();
    sinon.spy(export_dialog, 'fetchCSV');
    export_dialog.$el.find('*[data-format="csv"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetchCSV.calledOnce).toBeTruthy();
    export_dialog.fetchCSV.restore();
  })

  it("should use passed sql if provided", function() {
    export_dialog2 = new cdb.admin.ExportTableDialog({
      model: table,
      config: this.config,
      user_data: this.user_data,
      sql: "fakeSql"
    });
    expect(export_dialog2.getPlainSql()).toEqual('fakeSql')
  })

  it("should use gererate base sql if not provided", function() {
    expect(export_dialog.getPlainSql()).toEqual('select * from test')
  })

  it("should use the sql from the sqlView", function() {
    var sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from wadus limit 1' });
    table.useSQLView(sqlView);
    expect(export_dialog.getPlainSql()).toEqual('select * from wadus limit 1')
  })

  it("csv sql should return be a plain sql if not georeferenced", function() {
    table.set("schema", ['dubidubidua', 'string']);
    fetchResponse = false;
    table.set('geometry_types', []);
    expect(export_dialog.getGeomFilteredSql()).toEqual('select * from test')
  })

  it("should wrap csv sql if georeferenced", function() {
    var wrappedSql = export_dialog._CSV_FILTER.replace(/%%sql%%/g, 'select * from test');
    expect(export_dialog.getGeomFilteredSql()).toEqual(wrappedSql)
  });

  it("should close the dialog on click if initialized with the autoClose param", function() {
    export_dialog.options.autoClose = true;
    export_dialog.render();
    sinon.spy(export_dialog, 'hide');
    export_dialog.$el.find('*[data-format="svg"]').click();
    this.server.respond();

    expect(export_dialog.hide.called).toBeTruthy();;
  });

});
