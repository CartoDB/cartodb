
  describe("Dashboard view", function() {

    var view, visualizations, user, tables, router, $el;


    beforeEach(function() {
      window.isFirstTimeViewingDashboard = false;
      window.isJustLoggedIn = false;

      $el = $('<body>');
      router = new cdb.admin.dashboard.DashboardRouter();

      view = new cdb.admin.dashboard.Dashboard({
        el:          $el,
        user_data:   TestUtil.user_data,
        upgrade_url: "",
        config:      {},
        router:      router
      });
    });

    it("should render properly", function() {
      expect(_.size(view._subviews)).toBe(6);
    });

    it("should create tables and visualizations models", function() {
      expect(view.tables).toBeDefined();
      expect(view.visualizations).toBeDefined();
      expect(view.router).toBeDefined();
      expect(view.tags).not.toBeDefined();
    });

  });

