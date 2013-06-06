describe("cdb.admin.dashboard.Dashboard", function() {

  var dashboard, tables, router;

  afterEach(function() {
    Backbone.history.stop();
  });

  beforeEach(function() {

    tables = new cdb.admin.Tables();
    this.el = $('<div></div>');
    this.el.appendTo($('body'));

    this.createTables = function(n) {

      if (!n) n = tables.options.get('per_page')*1.6;

      var newTables = []

      for (var i = 0; i < n; i++) {
        newTables.push({ id: i, name: 'test', privacy: 'PRIVATE', rows_counted: 1, updated_at: new Date(), tags: 'a', table_size: 100, description: 'test' })
      }

      tables.reset(newTables);
      tables.total_entries = newTables.length;
    }

    router = new cdb.admin.dashboard.DashboardRouter();

    upgrade_url = "";

    config    = TestUtil.config;
    user_data = TestUtil.user_data;

    dashboard = new cdb.admin.dashboard.Dashboard({
      user_data: user_data,
      config:    config,
      router:    router
    });

    Backbone.history.start({ pushState: true, root: "/dashboard/"})

  });

});
