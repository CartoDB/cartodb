/**
*  The Holy Dashboard
*/

$(function() {

  cdb.admin.dashboard.Dashboard = cdb.core.View.extend({

    events: {},

    initialize: function() {

      cdb.config.set(this.options.config); // import config

      this._initRouter();
      this._initModels();
      this._initViews();
      this._initBindings();
    },

    _initRouter: function() {
      // Router
      this.router = this.options.router;

      // TODO: Deprecate this!
      this.router.bind("tables",         this._tables,         this);
      this.router.bind("visualizations", this._visualizations, this);
      this.router.bind("search",         this._search,         this);
      this.router.bind("tag",            this._tag,            this);

      this.router.model.bind('change', function() {
        console.log("change!");
      }, this)

      // And use each view or model -> this.router.model.bind('change', ..., this);
    },

    _initBindings: function() {
      _.bindAll(this, "_goto", "_whenScroll", "_fetchUserOnce");
      $(document).on("scroll", this._whenScroll);
    },

    _initModels: function() {

      this.user           = new cdb.admin.User(this.options.user_data);
      this.tables         = new cdb.admin.Visualizations({ type: "table" });
      this.visualizations = new cdb.admin.Visualizations({ type: "derived" });

      this.first_time = true;

      this.tables.bind('add remove reset',     this._onTablesFetch, this);
      this.visualizations.bind("reset remove", this._onVisFetch,    this);

      this.tables.bind('error', function(e) { cdb.log.info("error", e); });
    },

    /*
    * Routes
    */

    _tables: function(opts) {

      $("body").animate({ scrollTop: 0 }, 550);

      this.visualizationsView.hide();

      this.startView.model.set({path: "tables", what: "tables" });

      this._getTables(true, {
        q:            "",
        page:         opts.page || 1,
        tags:         "",
        per_page:     this.tables._TABLES_PER_PAGE,
        type:         "table",
        only_shared:  opts.shared,
        order:        this.tablesSortable.getSortMethod()
      });

    },

    _visualizations: function(opts) {

      $("body").animate({ scrollTop: 0 }, 550);

      this.startView.model.set({ path: "visualizations", what: "visualizations" });

      this.tablesView.hide();

      this._getVisualizations(true, {
        q:            "",
        page:         opts.page || 1,
        tags:         "",
        only_shared:  opts.shared,
        per_page:     this.visualizations._ITEMS_PER_PAGE,
        type:         "derived"
      });

    },

    _search: function(opts) {
      var model = opts.model;
      var page  = opts.page;
      var q     = opts.q;

      this.startView.model.set("path", "search");
      this.startView.model.set("what", model);

      if (model == 'visualizations') {

        this.tablesView.hide();
        this._getVisualizations(true, { q: q, page: page || 1, tags: "", per_page: this.visualizations._ITEMS_PER_PAGE, type: "derived" });

      } else if (model == 'tables') {

        this.visualizationsView.hide();
        this._getTables(true, { q: q, page: page || 1, tags: "", per_page: this.tables._TABLES_PER_PAGE, type: "table", order: this.tablesSortable.getSortMethod() });
      }

    },

    _tag: function(opts) {

      var model = opts.model;
      var page  = opts.page;
      var tag   = opts.tag;
      var type  = 'table';

      this.startView.model.set({ path: "tag", what: model });

      if (model == 'visualizations') {

        type = 'derived';

        this.tablesView.hide();
        this._getVisualizations(true, { q: "", page: page || 1, tags: tag, per_page: this.visualizations._ITEMS_PER_PAGE, type: "derived" });

      } else if (model == 'tables') {

        this.visualizationsView.hide();
        this._getTables(true, { q: "", page: page || 1, tags: tag, per_page: this.tables._TABLES_PER_PAGE, type: "table", order: this.tablesSortable.getSortMethod() });

      }
    },

    _getVisualizations: function(show_main_loader, options) {

      if (show_main_loader) this.$el.find(".main_loader").show();

      var path = this.startView.model.get("path");

      

      this.visualizations.options.set(options);
      this.visualizationsView.showLoader();

      var order = this.visSortable.getSortHash();
      this.visualizations.fetch(order);
    },

    _getTables: function(show_main_loader, options) {

      if (show_main_loader) this.$el.find(".main_loader").show();
      this.tablesView.showLoader();

      var path = this.startView.model.get("path");


      if (path == 'tag' || path == 'tables' || path == 'search') this.tablesView.model.set("padding", true);
      else this.tablesView.model.set("padding", false);

      this.tables.options.set(options);

      var order = this.tablesSortable.getSortHash();
      this.tables.fetch(order);

    },

    _onVisFetch: function() {

      this.$el.find(".main_loader").hide();

      if (this.startView.model.get("path") == 'index') {

        $(".no_vis").removeClass("only");

      } else if (this.startView.model.get("path") == 'tables') {
        this.visualizationsView.hide();
      } else if (this.startView.model.get("path") == 'visualizations') {

        this.tablesView.hide();

        $("article.visualizations").removeClass("no_margin");

        if (this.visualizations.total_entries == 0) {
          $(".no_vis").addClass("only");
        } else {
          $(".no_vis").removeClass("only");
        }
      }

    },

    _fetchUserOnce: function() {
      if (!this.first_time) this.user.fetch();
      this.first_time = false;
      if (dashboard_first_time) { cdb.god.trigger('mixpanel', 'Dashboard viewed for the first time') }
      cdb.god.trigger('mixpanel', 'Dashboard viewed');
      if (just_logged_in && window.mixpanel && window.mixpanel.track && window.mixpanel.people) {
        window.mixpanel.track("Logged in");
        window.mixpanel.people.increment("login_count", 1);
      }
    },

    _onTablesFetch: function() {

      this.$el.find(".main_loader").hide();

      this._fetchUserOnce();
      var path = this.startView.model.get("path");

      if (path == 'visualizations')
      {
        this.tablesView.hide();
      }
      else if (path == 'tables')
      {
        this.visualizationsView.hide();
        this._toggleAddTablesView();
      }

    },

    _toggleAddTablesView: function() {

      if (this.tables.total_entries > 0 && this.tables.total_entries < 4) {
        this.moreDataBar.show();
      } else {
        this.moreDataBar.hide();
      }

    },


    _goto: function(e, where) {
      if (e) this.killEvent(e)

      if (e && $(e.target).hasClass("disabled")) return;

      this.router.navigate(where, { trigger: true });
    },

    _setupVisualizations: function() {

      var self = this;

      this.visualizationsView = new cdb.admin.dashboard.Visualizations({
        el:             this.$('article.visualizations'),
        user:           this.user,
        visualizations: this.visualizations,
        router:         this.router,
        config:         this.options.config
      });

      this.visSortable = new cdb.admin.Sortable({
        what: "visualizations",
        items: this.visualizations
      });

      this.visSortable.bind("fetch", function(order) {
        self._getVisualizations(false, { type: "derived", order: order });
      });

      this.visualizationsView.bind("removeVisualization", function() {

        this.visualizationsView.showLoader();
        this._getVisualizations(false, { type: "derived", order: this.visSortable.getSortHash() });

      }, this);

      this.$("article.visualizations aside.right > div.content").append(this.visSortable.render().$el);

      this.visPaginator = new cdb.admin.DashboardPaginator({
        el: this.$("article.visualizations .paginator"),
        what: "visualizations",
        items: this.visualizations
      });

      this.visPaginator.bind('viewAll', function() {
        self._goto(null, "/visualizations");
      });

      this.visPaginator.bind('goToPage', function(page) {
        self._goto(null, page);
      });

      // Create vis button
      this.visAside = new cdb.admin.dashboard.Aside({
        el: this.$el.find("article.visualizations aside")
      });

    },

    _setupTables: function() {

      var self = this;

      this.tablesView = new cdb.admin.dashboard.Tables({
        el:             this.$('article.tables'),
        tables:         this.tables,
        user:           this.user,
        config:         this.options.config,
        importer:       this.importer
      });

      this.tablesView.bind('fetch', function() {
        self._getTables(false);
      });

      this.tablesView.bind('openCreateTableDialog', function() {
        self.createTable._showDialog();
      });

      this.createTable = new cdb.admin.CreateTable({
        el:       $("body"),
        importer: this.importer,
        model:    this.user,
        tables:   this.tables,
        config:   this.options.config
      });

      this.tablesSortable = new cdb.admin.Sortable({
        what: "tables",
        items: this.tables
      });

      this.tablesSortable.bind("fetch", function(order) {
        self._getTables(false, { type: "table", order: order });
      });

      this.$("article.tables aside.right > div.content").append(this.tablesSortable.render().el);

      this.tablesPaginator = new cdb.admin.DashboardPaginator({
        el: this.$("article.tables .paginator"),
        what: "tables",
        items: this.tables
      });

      this.tablesPaginator.bind('viewAll', function() {
        self._goto(null, "/tables");
      });

      this.tablesPaginator.bind('goToPage', function(page) {
        self._goto(null, page);
      });

      // Create moreDataBar button
      this.moreDataBar = new cdb.admin.dashboard.MoreDataBar();
      this.$el.find(".bars").append(this.moreDataBar.render().el);

      // Reference support address block
      this.supportBlock = new cdb.admin.DashboardSupport({
        el: this.$('article.support'),
        model: this.user
      })

      // Create table button
      this.tableAside = new cdb.admin.dashboard.Aside({
        el: this.$el.find("article.tables aside")
      });

    },

    _setupSearchView: function() {
      this.filterView = new cdb.ui.common.FilterView({
        visualizations: this.visualizations,
        config:         this.options.config,
        tables:         this.tables,
        user:           this.user,
        router:         this.router
      });
      this.$('div.subheader').after(this.filterView.render().el);
    },

    _setupStartView: function() {
      this.startView = new cdb.admin.dashboard.StartView({
        el:                 this.$el,
        tablesView:         this.tablesView,
        visualizationsView: this.visualizationsView,
        visualizations:     this.visualizations,
        tables:             this.tables,
        router:             this.router,
        user:               this.user,
        importer:           this.importer,
        config:             this.options.config
      });

      var self = this;

      this.startView.bind("openCreateTableDialog", function(url) {
        self.createTable._showDialog(null, null, url);
      }, this);

    },

    _initViews: function() {
      // Background Importer
      this.importer = new cdb.ui.common.BackgroundImporter({
        template_base: 'common/views/background_importer'
      });
      this.$el.append(this.importer.render().el);
      this.addView(this.importer);

      // Dashboard header
      var dashboard_header = new cdb.admin.DashboardHeader({
        el:             this.$('header'),
        tables:         this.tables,
        visualizations: this.visualizations,
        user:           this.user,
        router:         this.router
      });

      

      this._setupUserStats();
      this._setupSearchView();
      this._setupVisualizations();
      this._setupTables();
      this._setupStartView();

      this._checkActiveImports();

      // global click
      enableClickOut(this.$el);
    },

    _setupUserStats: function() {
      this.userStats = new cdb.admin.dashboard.UserStats({
        upgrade_url:  this.options.upgrade_url,
        model:        this.user,
        tables:       this.tables,
        router:       this.router
      });

      this.$('div.subheader').append(this.userStats.render().el);
      this.addView(this.userStats);
    },

    /**
     *  Check if there is any pending import in the background
     */
    _checkActiveImports: function() {

      // Check pending importations
      var imports = new cdb.admin.Imports()
      , self    = this;

      // Start background importer
      this.importer.changeState({ state: "checking" });

      imports.bind("importsFinished", function(last_imp) {
        self.importer.changeState(last_imp.toJSON());
        setTimeout(self.importer.hide, 3000);
        imports.unbind();
      },this).bind("importsFailed", function(failed_imports){
        self.importer.changeState(failed_imports[0].toJSON());
      },this).bind("importsStart", function(e){
        self.importer.changeState({ state: "preprocessing" });
      },this).bind("importsEmpty", function(e){
        self.importer.hide();
        imports.unbind();
      });

      imports.pollCheck();
    },

    /**
     *  Calculate scroll pagination and moves the asides when needed
     */
    _whenScroll: function(ev) {
      var model = this.router.model.get('model'); // Tables or visualizations?
      
      // Prevents weird bug with scrolling
      if (model === "tables" && this.tables && this.tables.size() <= 1) return;

      this[ model === "tables" ? 'tableAside' : 'visAside' ].scroll(ev);
    }

  });


  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';

    var router = new cdb.admin.dashboard.DashboardRouter();

    // Mixpanel test
    if (window.mixpanel) {
      new cdb.admin.Mixpanel({
        user: user_data,
        token: mixpanel_token
      });
    }

    // Store JS errors
    var errors = new cdb.admin.ErrorStats({ user_data: user_data });

    var dashboard = new cdb.admin.dashboard.Dashboard({
      el:          document.body,
      user_data:   user_data,
      upgrade_url: upgrade_url,
      config:      config,
      router:      router
    });

    window.dashboard = dashboard;

    Backbone.history.start({ pushState: true, root: "/dashboard/"})
  });

});

