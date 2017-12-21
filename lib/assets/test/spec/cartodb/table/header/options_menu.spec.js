describe("Header options menu", function() {

  var options_menu, sqlView, table, map, cartodb_layer;
  beforeEach(function() {

    this.vis = new cdb.admin.Visualization({
      map_id:           96,
      active_layer_id:  null,
      name:             "test_table",
      description:      "Visualization description",
      tags:             ["jamon","probando","test"],
      privacy:          "PUBLIC",
      updated_at:       "2013-03-04T18:09:34+01:00",
      type:             "table",
      permission:       {
        owner:  { username: 'staging20', avatar_url: 'http://test.com', id: 2 }
      }
    });

    cartodb_layer = new cdb.admin.CartoDBLayer({ table_name: 'test_table' });

    // Set permissions for last visualization layer
    cartodb_layer.table.permission = new cdb.admin.Permission({
      owner:  { username: 'staging20', avatar_url: 'http://test.com', id: 2 },
      acl:    []
    });

    this.vis.map.layers.reset([
      new cdb.geo.MapLayer(),
      cartodb_layer
    ]);

    this.user = TestUtil.createUser({ username: 'staging20' });

    // Options menu
    options_menu = t = new cdb.admin.HeaderOptionsMenu({
      target: $('a.options'),
      model: this.vis,
      username: this.user.get('username'),
      private_tables: this.user.get('actions').private_tables,
      geocoder: {},
      dataLayer: cartodb_layer,
      user: this.user,
      template_base: 'table/header/views/options_menu'
    });

  });

  it("should open the menu options with table mode", function() {
    options_menu.render();
    expect(options_menu.$el.find("li").size()).toEqual(7);
    expect(options_menu.$el.find("div.progress-bar").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Duplicate dataset')").size()).toEqual(1);
  });

  it("should create geocoding progress bar correctly", function() {
    options_menu.render();

    // Normal
    expect(Math.floor(options_menu.$el.find("div.progress-bar .bar-2").width())).toEqual(20);
    expect(options_menu.$el.find("div.progress-bar .bar-2").hasClass('danger')).toBeFalsy();

    // Caution
    options_menu.user.set('geocoding', {
      block_price: 150,
      hard_limit: false,
      monthly_use: 4000,
      quota: 5000
    });
    options_menu.render();

    expect(Math.floor(options_menu.$el.find("div.progress-bar .bar-2").width())).toEqual(80);
    expect(options_menu.$el.find("div.progress-bar .bar-2").hasClass('caution')).toBeTruthy();
    expect(options_menu.$el.find("div.progress-bar .bar-2").hasClass('danger')).toBeFalsy();

    // Danger
    options_menu.user.set('geocoding', {
      block_price: 150,
      hard_limit: false,
      monthly_use: 4999,
      quota: 5000
    });
    options_menu.render();

    expect(Math.floor(options_menu.$el.find("div.progress-bar .bar-2").width())).toEqual(99);
    expect(options_menu.$el.find("div.progress-bar .bar-2").hasClass('caution')).toBeFalsy();
    expect(options_menu.$el.find("div.progress-bar .bar-2").hasClass('danger')).toBeTruthy();

  });

  it("should show 'sync settings' option if table is synced in table mode", function() {
    cartodb_layer.table.synchronization.set('id', 'test');
    options_menu.render();
    expect(options_menu.$el.find("li:contains('Sync settings')").size()).toEqual(1);
  });

  it("should show geocoding option disabled if table is synced in table mode", function() {
    cartodb_layer.table.synchronization.set('id', 'test');
    options_menu.render();
    expect(options_menu.$el.find("li:contains('Georeference')").hasClass('disabled')).toBeTruthy();
  });

  it("should open the menu options with visualization mode", function() {
    this.vis.set('type', 'derived');
    options_menu.render();
    expect(options_menu.$el.find("li").size()).toEqual(7);
    expect(options_menu.$el.find("li:contains('Export layer')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Georeference layer')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Duplicate map')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Lock map')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Change privacy')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Delete map')").size()).toEqual(1);
  });

  it("shouldn't display the 'Georeference layer' option if table has a sql applied in visualization mode", function() {
    this.vis.set('type', 'derived');
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from test' })
    cartodb_layer.set('query', 'select * from test');
    this.vis.map.layers.last().table.useSQLView(sqlView);
    options_menu.render();
    expect(options_menu.$el.find("li").size()).toEqual(7);
    expect(options_menu.$el.find("li:contains('Export layer')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Dataset from query')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Duplicate map')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Lock map')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Change privacy')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Delete map')").size()).toEqual(1);
  });

  it("shouldn't have disabled export and duplicate links if a query is applied in table mode", function() {
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from test' })
    cartodb_layer.set('query', 'select * from test');
    this.vis.map.layers.last().table.useSQLView(sqlView);
    options_menu.render();
    expect(options_menu.$el.find("li.disabled").size()).toEqual(0);
    expect(options_menu.$el.find("li:contains('Dataset from query')").size()).toEqual(1);
  });

  it("should have disabled export and duplicate links if a query is applied but it is not valid in table mode", function() {
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from test' });
    this.vis.map.layers.last().table.useSQLView(sqlView);
    options_menu.render();
    expect(options_menu.$el.find("li.disabled").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Dataset from query')").size()).toEqual(1);
  });

  it("shouldn't offer 'delete table' and 'change privacy' options if user is not the owner", function() {
    cartodb_layer.table.permission = new cdb.admin.Permission({
      owner:  { username: 'test', avatar_url: 'http://test.com', id: 10 }
    });
    options_menu.render();
    expect(options_menu.$("li a:contains('Change privacy')").length).toBe(0);
    expect(options_menu.$("li a:contains('Sync settings')").length).toBe(0);
    expect(options_menu.$("li a:contains('Delete this dataset')").length).toBe(0);
  });

  it("shouldn't offer 'delete map' or 'change privacy' if user is not the owner", function() {
    this.vis.set('type', 'derived');
    this.vis.permission = new cdb.admin.Permission({
      owner:  { username: 'test', avatar_url: 'http://test.com', id: 10 }
    });
    options_menu.render();
    expect(options_menu.$("li a:contains('Delete map')").length).toBe(0);
    expect(options_menu.$("li a:contains('Change privacy')").length).toBe(0);
  });

  it("shouldn't have disabled any option if a query is applied in visualization mode", function() {
    this.vis.set('type', 'derived');
    sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from test' })
    this.vis.map.layers.last().table.useSQLView(sqlView);
    options_menu.render();
    expect(options_menu.$el.find("li.disabled").size()).toEqual(0);
    expect(options_menu.$el.find("li:contains('Duplicate map')").size()).toEqual(1);
    expect(options_menu.$el.find("li:contains('Delete map')").size()).toEqual(1);
  });

});
