describe("cdb.admin.dashboard.Dashboard", function() {

  describe("Dashboard", function() {

    var dashboard, tables, router;

    afterEach(function() {
      Backbone.history.stop();
      $(".dashboard").remove();
    });

    beforeEach(function() {

      tables = new cdb.admin.Tables();
      this.el = $('<div class="dashboard"></div>');
      this.el.appendTo($('body'));

      this.createTables = function(n) {

        if (!n) n = tables.options.get('per_page')*1.6;

        var newTables = []

      for (var i = 0; i < n; i++) {

        newTables.push({
          id: i,
          name: 'test',
          privacy: 'PRIVATE',
          rows_counted: 1,
          updated_at: new Date(),
          tags: 'a',
          table_size: 100,
          description: 'test' })
      };

    tables.reset(newTables);
    tables.total_entries = newTables.length;
      }

      router = new cdb.admin.dashboard.DashboardRouter();

      upgrade_url = "";

      config    = TestUtil.config;
      user_data = TestUtil.user_data;

      dashboard = new cdb.admin.dashboard.Dashboard({
        el: $(".dashboard"),
                user_data: user_data,
                config:    config,
                router:    router
      });

      Backbone.history.start({ pushState: true, root: "/dashboard/"})

    });

    it("should go to the tables page when a table tag is removed", function() {

      var spy = spyOn(router, 'tables').andCallThrough();

      pushStateSpy = spyOn(window.history, 'pushState').andCallFake(function (data, title, url) {
        expect(url).toEqual('/dashboard/tables');
        router.tables();
      });

      dashboard.tablesView.trigger("removeTag");

      expect(pushStateSpy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();

    });

    it("should go to the Visualizations page when a vis tag is removed", function() {

      var spy = spyOn(router, 'visualizations').andCallThrough();

      pushStateSpy = spyOn(window.history, 'pushState').andCallFake(function (data, title, url) {
        expect(url).toEqual('/dashboard/visualizations');
        router.visualizations();
      });

      dashboard.visualizationsView.trigger("removeTag");

      expect(pushStateSpy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalled();

    });

  });

  describe("Aside", function() {

    var dashboard, tables, router;

    afterEach(function() {
      Backbone.history.stop();
      $(".dashboard").remove();
    });

    beforeEach(function() {

      tables = new cdb.admin.Tables();
      this.el = $('<div class="dashboard"></div>');
      this.el.appendTo($('body'));

      this.createTables = function(n) {

        if (!n) n = tables.options.get('per_page')*1.6;

        var newTables = []

      for (var i = 0; i < n; i++) {

        newTables.push({
          id: i,
          name: 'test',
          privacy: 'PRIVATE',
          rows_counted: 1,
          updated_at: new Date(),
          tags: 'a',
          table_size: 100,
          description: 'test' })
      };

    tables.reset(newTables);
    tables.total_entries = newTables.length;
      }

      this.createTables(2);

      router = new cdb.admin.dashboard.DashboardRouter();

      upgrade_url = "";

      config    = TestUtil.config;
      user_data = TestUtil.user_data;
      user_data.table_quota = 2;

      dashboard = new cdb.admin.dashboard.Dashboard({
        el: $(".dashboard"),
                user_data: user_data,
                config:    config,
                router:    router
      });

      Backbone.history.start({ pushState: true, root: "/dashboard/"})

    });


    it("should have a tableAside", function() {

      expect(dashboard.tableAside).toBeDefined();
      expect(dashboard.tableAside.$el.hasClass("disabled")).toBeFalsy();

    });

    it("should disable the tableAside when the limit of tables has been reached", function() {

      expect(dashboard.tablesView.active).toBeTruthy();
      dashboard.tables.reset();
      console.log(dashboard.tables.length);
      expect(dashboard.tablesView.active).toBeFalsy();

    });

  });

});
