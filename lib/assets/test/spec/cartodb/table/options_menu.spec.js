describe("Header options menu", function() {

  var options_menu, sqlView, table, map;
  beforeEach(function() {

    this.vis = new cdb.admin.Visualization({
      map_id:           96,
      active_layer_id:  null,
      name:             "test_table",
      description:      "Visualization description",
      tags:             ["jamon","probando","test"],
      privacy:          "PUBLIC",
      updated_at:       "2013-03-04T18:09:34+01:00",
      type:             "table"
    });

    cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table'});

    this.vis.map.layers.reset([
      new cdb.geo.MapLayer(),
      cartodb_layer
    ]);

    this.user = TestUtil.createUser();

    // Options menu
    options_menu = t = new cdb.admin.HeaderOptionsMenu({
      target: $('a.options'),
      model: this.vis,
      username: this.user.get('username'),
      geocoder: {},
      template_base: 'table/views/header_options_menu'
    });

  });

  it("should open the menu options with table mode", function() {
    options_menu.render();
    expect(options_menu.$el.find("li").size()).toEqual(6);
    expect(options_menu.$el.find("li:contains('Duplicate table')").size()).toEqual(1);
  });

  it("should open the menu options with visualization mode", function() {
    this.vis.set('type', 'derived')
    options_menu.render();
    expect(options_menu.$el.find("li").size()).toEqual(2);
    expect(options_menu.$el.find("li:contains('Duplicate visualization')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Delete visualization')").size()).toEqual(1);
  });

  it("shouldn't have disabled export and duplicate links if a query is applied in table mode", function() {
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from test' })
    this.vis.map.layers.last().table.useSQLView(sqlView);
    options_menu.render();
    expect(options_menu.$el.find("li.disabled").size()).toEqual(3);
    expect(options_menu.$el.find("li:contains('Table from query')").size()).toEqual(1);
  });

  it("shouldn't have disabled any option if a query is applied in visualization mode", function() {
    this.vis.set('type', 'derived');
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from test' })
    this.vis.map.layers.last().table.useSQLView(sqlView);
    options_menu.render();
    console.log(options_menu.$el.html());
    expect(options_menu.$el.find("li.disabled").size()).toEqual(0);
    expect(options_menu.$el.find("li:contains('Duplicate visualization')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Delete visualization')").size()).toEqual(1);
  });
});