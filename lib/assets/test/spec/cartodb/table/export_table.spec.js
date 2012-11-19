
describe("Export table", function() {
  var export_dialog, sqlView, table;
  beforeEach(function() {
    var schema = [
      ['test', 'number'],
      ['test2', 'string'],
      ['the_geom', 'geometry'],
    ]
    table = TestUtil.createTable('test', schema);

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
    export_dialog.baseUrl = 'dummy';
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

  xit("should submit the form when clicked", function() {
    export_dialog.render();
    var called = false;
    export_dialog.$el.find('form').bind('submit', function() { called = true})
    export_dialog.$el.find('*[data-format="csv"]').click();
    var response = this.server.respond();
    expect(called).toBeTruthy();
  })

  it("should return correct geoformat obj", function() {
    var geo = export_dialog.formats[2];
    var geo2 = export_dialog.getFormat(geo.format);
    expect(_.isEqual(geo, geo2)).toBeTruthy();
  })

  xit("should call csv fetcher when csv is clicked", function() {
    export_dialog.render();
    spyOn(export_dialog, 'fetchCSV');
    export_dialog.$el.find('*[data-format="csv"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetchCSV).toHaveBeenCalled();
  })

  xit("should call svg fetcher when svg is clicked", function() {
    export_dialog.render();
    spyOn(export_dialog, 'fetchSVG');
    export_dialog.$el.find('*[data-format="svg"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetchSVG).toHaveBeenCalled();
  })


  xit("should call plain fetcher when geoJson is clicked", function() {
    export_dialog.render();
    spyOn(export_dialog, 'fetch');
    export_dialog.$el.find('*[data-format="geojson"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetch).toHaveBeenCalled();
  })


  it("should detect if the table is georeferenced", function() {
    expect(export_dialog.isGeoreferenced()).toBeTruthy();;
  })

  it("should detect if the table is NOT georeferenced", function() {
    table.set("schema", ['dubidubidua', 'string']);
    expect(export_dialog.isGeoreferenced()).toBeFalsy();;
  })

  it("should not show a warning if the table is georeferenced", function() {
    export_dialog.render();
    expect(export_dialog.$('.geospatial').is(':visible')).toBeFalsy();;
  })

  it("should show a warning if the table is NOT georeferenced", function() {
    table.set("schema", ['dubidubidua', 'string']);
    export_dialog.render();
    expect(export_dialog.$('.geospatial').is(':visible')).toBeFalsy();;
  })

  it("should not show generation warning when rendered", function() {
    export_dialog.render();
    expect(export_dialog.$('.generating').is(':visible')).toBeFalsy();;
  })

  xit("should show a warning after click", function() {
    export_dialog.render();
    export_dialog.$el.find('*[data-format="svg"]').click();
    this.server.respond();

    expect(export_dialog.$('.generating').is(':visible')).toBeFalsy();;
  })

  xit("should not show a warning if the table is NOT georeferenced after a click", function() {
    table.set("schema", ['dubidubidua', 'string']);
    export_dialog.render();
    export_dialog.$el.find('*[data-format="svg"]').click();
    expect(export_dialog.$('.geospatial').is(':visible')).toBeFalsy();;
  })


  xit("should not call svg fetcher if there are not the_geom", function() {
    table.set("schema", ['dubidubidua', 'string']);
    export_dialog.render();
    sinon.spy(export_dialog, 'fetchSVG');
    export_dialog.$el.find('*[data-format="svg"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetchSVG.calledOnce).toBeFalsy();
    export_dialog.fetchSVG.restore();
  })

  it("should not call geojson fetcher if there are not the_geom", function() {
    table.set("schema", ['dubidubidua', 'string']);
    export_dialog.render();
    sinon.spy(export_dialog, 'fetch');
    export_dialog.$el.find('*[data-format="geojson"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetch.calledOnce).toBeFalsy();
    export_dialog.fetch.restore();
  })

  xit("should not call shp fetcher if there are not the_geom", function() {
    table.set("schema", ['dubidubidua', 'string']);
    export_dialog.render();
    sinon.spy(export_dialog, 'fetch');
    export_dialog.$el.find('*[data-format="shp"]').click();
    var response = this.server.respond();
    expect(export_dialog.fetch.calledOnce).toBeFalsy();
    export_dialog.fetch.restore();
  })

  xit("should call csv fetcher when csv is clicked even if there's not the_geom", function() {
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

  it("csv sql should return be a plain sql if not georeferenced", function() {
    table.set("schema", ['dubidubidua', 'string']);
    expect(export_dialog.getGeomFilteredSql()).toEqual('select * from test')
  })

  it("should wrap csv sql if georeferenced", function() {
    var wrappedSql = export_dialog._CSV_FILTER.replace(/%%sql%%/g, 'select * from test');
    expect(export_dialog.getGeomFilteredSql()).toEqual(wrappedSql)
  });

});
