
describe("Table options menu", function() {
  var options_menu, sqlView, table, map;
  beforeEach(function() {

    table = TestUtil.createTable('test');
    map = new cdb.admin.Map();

    options_menu = new OptionsMenu({
      model: table,
      target: $('a.options'),
      model: { username: "cartodb" },
      username: "cartodb",
      table: table,
      template_base: 'table/views/header_table_options'
    });
  });

  it("should open the menu options", function() {
    options_menu.render();
    expect(options_menu.$el.find("li").size()).toEqual(4);
    expect(options_menu.$el.find("li:contains('Duplicate table')").size()).toEqual(1);
  });

  it("should have disabled some options due to the fact that the query is not ok or null", function() {
    var s = {changed: function() {}};

    map.bind('change:dataLayer', function() {
      sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from a asdf asdf asdf' })
      table.useSQLView(sqlView);
      options_menu.options.dataLayer = this.get('dataLayer');
      options_menu.render();
      expect(options_menu.$el.find("li.disabled").size()).toEqual(3);
      expect(options_menu.$el.find("li:contains('Table from query')").size()).toEqual(1);
    });

    map.addDataLayer(new cdb.geo.MapLayer());
  });

  it("shouldn't have disabled export and duplicate links", function() {
    var s = {changed: function() {}};

    map.bind('change:dataLayer', function() {
      sqlView = new cdb.admin.SQLViewData(null, { sql: 'select * from test' })
      table.useSQLView(sqlView);
      this.get('dataLayer').save({ 'query' : 'SELECT * from test'});
      options_menu.options.dataLayer = this.get('dataLayer');
      options_menu.render();
      expect(options_menu.$el.find("li.disabled").size()).toEqual(1);
      expect(options_menu.$el.find("li:contains('Table from query')").size()).toEqual(1);
    });

    map.addDataLayer(new cdb.geo.MapLayer());
  });
});