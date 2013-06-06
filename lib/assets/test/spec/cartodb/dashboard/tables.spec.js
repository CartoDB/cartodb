describe("cdb.admin.dashboard.Tables", function() {
  var tablesView, tables, user;

  afterEach(function() {
    tablesView.$el.remove();
  });

  beforeEach(function() {

    var el = $('<article class="tables"></articles>');
    el.appendTo($('body'));

    createTable = function() {
      return new cdb.admin.Visualization({
        map_id:           96,
        active_layer_id:  null,
        name:             name || "test_vis",
        description:      "Visualization description",
        tags:             ["tag1", "tag", "tag3"],
        privacy:          "PUBLIC",
        updated_at:       "2013-03-04T18:09:34+01:00",
        table: { id: 396, name: "untitled_table_9", privacy: "PRIVATE", row_count: 0, size: 16384, updated_at: "2013-05-29T13:23:10+02:00" },
        type:             "table"
      });
    }

    var tablesCollection = [];

    var n = 10;

    for (var i = 0; i < n; i++) {
      tablesCollection.push(createTable());
    }

    tables = new cdb.admin.Visualizations(tablesCollection, { type: "table" });
    tables.total_entries = n;

    this.el = $('<div></div>');
    this.el.appendTo($('body'));

    config    = TestUtil.config;
    user_data = TestUtil.user_data;
    user      = new cdb.admin.User(user_data);

    tablesView = new cdb.admin.dashboard.Tables({
      el:             this.el,
      tables:         tables,
      user:           user,
      config:         config,
      importer:       null
    });

  });

  it("should show the recent title", function() {
    tables.options.set({ per_page: tables._PREVIEW_ITEMS_PER_PAGE });
    tablesView._setupTablesView();
    tablesView.tableList.render();

    expect(tablesView.$el.find("h2 span").text()).toEqual('Recent tables');
  });

  it("should show the default title", function() {
    tables.options.set({ per_page: tables._ITEMS_PER_PAGE });
    tablesView._setupTablesView();
    tablesView.tableList.render();
    expect(tablesView.$el.find("h2 span").text()).toEqual(tables.length + ' tables created');
  });

  it("should show that there are no results", function() {
    tables.total_entries = 0;
    tables.options.set({ per_page: tables._ITEMS_PER_PAGE, q: "abcdefg" });
    tablesView._setupTablesView();
    tablesView.tableList.render();
    expect(tablesView.$el.find("h2 span").text()).toEqual('0 tables with abcdefg found');
  });

  it("shouldn't show the view_all link when showing the deafult amount of items", function() {
    tables.options.set({ per_page: tables._ITEMS_PER_PAGE });
    tablesView._setupTablesView();
    tablesView.tableList.render();
    expect(tablesView.$el.hasClass("view_all")).toBeFalsy();
  });

  it("should show the view_all link", function() {
    tables.options.set({ per_page: tables._PREVIEW_ITEMS_PER_PAGE });
    tablesView._setupTablesView();
    tablesView.tableList.render();
    expect(tablesView.$el.hasClass("view_all")).toBeTruthy();
  });

  it("should render the tag title", function() {

    tables.options.set({ q: "", tags: "tag3", per_page: tables._TABLES_PER_PAGE });
    tablesView._setupTablesView();
    tablesView.tableList.render();

    expect(tablesView.$el.find("h2 span").text()).toEqual(tables.length + ' tables with the tag tag3');
  });

  it("should trigger an event with a tag is removed", function() {

    tables.options.set({ q: "", tags: "tag3", per_page: tables._TABLES_PER_PAGE });
    tablesView._setupTablesView();
    tablesView.tableList.render();

    var spy = spyOn(tablesView, "trigger");
    tablesView.$el.find(".remove")[0].click();

    expect(spy).wasCalledWith("removeTag", tablesView);

  });

});



