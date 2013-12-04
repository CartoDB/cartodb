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

      this.router         = this.options.router;

      this.router.bind("tables",         this._tables,         this);
      this.router.bind("visualizations", this._visualizations, this);
      this.router.bind("search",         this._search,         this);
      this.router.bind("tag",            this._tag,            this);

    },

    _initBindings: function() {

      var self = this;

      _.bindAll(this, "_goto", "_whenScroll", "_fetchUserOnce");

      $(document).on("scroll", this._whenScroll);

      $("header li a.tables, article.tables .view_all").on("click", function(e) { self._goto(e, "/tables"); });
      $("header li a.visualizations, article.visualizations .view_all").on("click", function(e) { self._goto(e, "/visualizations"); });
      $("header li a.dashboard").on("click",                                        function(e) { self._goto(e, ""); });

      $("body").on("click", "section.visualizations .tags a", function(e) {
        self._goto(e, "/visualizations/tag/" + $(e.target).attr("data-tag"));
      });

      $("body").on("click", "section.tables .tags a", function(e) {
        self._goto(e, "/tables/tag/" + $(e.target).attr("data-tag"));
      });

    },

    _initModels: function() {

      this.user           = new cdb.admin.User(this.options.user_data);
      this.tables         = new cdb.admin.Visualizations({ type: "table" });
      this.visualizations = new cdb.admin.Visualizations({ type: "derived" });
      this.tags           = new cdb.admin.Tags();

      this.first_time = true;

      this.tables.bind('add remove reset',     this._onTablesFetch, this);
      this.visualizations.bind("reset remove", this._onVisFetch,    this);

      this.tables.bind('error', function(e) {
        cdb.log.info("error", e);
      });

    },

    /*
    * Routes
    */

    _index: function() {

      $("body").animate({ scrollTop: 0 }, 550);

      this.startView.model.set("path", "index");

      this.searchView.setQuery();
      this.searchView.model.set("visible", false);

      this.tablesView.hide();
      this._getVisualizations(true, { q: "", tags: "", per_page: this.visualizations._PREVIEW_ITEMS_PER_PAGE });

      this.filterTag.model.set({ type: "" });

    },

    _tables: function(page) {

      $("body").animate({ scrollTop: 0 }, 550);

      this.searchView.setQuery();
      this.searchView.model.set("visible", false);

      this.visualizationsView.hide();

      this.startView.model.set({path: "tables", what: "tables" });

      this._getTables(true, { q: "", page: page || 1, tags: "", per_page: this.tables._TABLES_PER_PAGE, type: "table", order: this.tablesSortable.getSortMethod() });

      this.filterTag.model.set({ type: "table", name: "" });

    },

    _visualizations: function(page) {

      $("body").animate({ scrollTop: 0 }, 550);

      this.searchView.setQuery();
      this.searchView.model.set("visible", false);

      this.startView.model.set({ path: "visualizations", what: "visualizations" });

      this.tablesView.hide();

      this._getVisualizations(true, { q: "", page: page || 1, tags: "", per_page: this.visualizations._ITEMS_PER_PAGE, type: "derived" });

      this.filterTag.model.set({ type: "derived", name: "" });

    },

    _search: function(opts) {
      var model = opts.model;
      var page  = opts.page;
      var q     = opts.q;

      this.startView.model.set("path", "search");
      this.startView.model.set("what", model);

      this.searchView.model.set("visible", true);
      this.searchView.setQuery(q);

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

      this.searchView.setQuery();
      this.searchView.model.set("visible", true);

      this.startView.model.set({ path: "tag", what: model });

      if (model == 'visualizations') {

        type = 'derived';

        this.tablesView.hide();
        this._getVisualizations(true, { q: "", page: page || 1, tags: tag, per_page: this.visualizations._ITEMS_PER_PAGE, type: "derived" });

      } else if (model == 'tables') {

        this.visualizationsView.hide();
        this._getTables(true, { q: "", page: page || 1, tags: tag, per_page: this.tables._TABLES_PER_PAGE, type: "table", order: this.tablesSortable.getSortMethod() });

      }

      this.filterTag.model.set({ type: type, name: tag });

    },

    _getVisualizations: function(show_main_loader, options) {

      if (show_main_loader) this.$el.find(".main_loader").show();

      var path = this.startView.model.get("path");

      if (path == 'index') this.visualizationsView.showDefaultTitle(true);
      else this.visualizationsView.showDefaultTitle(false);

      this.visualizations.options.set(options);
      this.visualizationsView.showLoader();

      var order = this.visSortable.getSortHash();
      this.visualizations.fetch(order);

    },

    _getTables: function(show_main_loader, options) {

      if (show_main_loader) this.$el.find(".main_loader").show();
      this.tablesView.showLoader();

      var path = this.startView.model.get("path");

      if (path == 'tag' || path == 'tables') this.tablesView.showDefaultTitle(false);
      else this.tablesView.showDefaultTitle(true);

      if (path == 'tag' || path == 'tables' || path == 'search') this.tablesView.model.set("padding", true);
      else this.tablesView.model.set("padding", false);

      this.tables.options.set(options);

      var order = this.tablesSortable.getSortHash();
      this.tables.fetch(order);

    },

    _onVisFetch: function() {

      this.$el.find(".main_loader").hide();

      if (this.startView.model.get("path") == 'index') {

        if (this.visualizations.total_entries > 0) {
          this.searchView.setQuery();
          this.searchView.model.set("visible", true);
        } else {
          this.searchView.setQuery();
          this.searchView.model.set("visible", false);
        }

        $(".no_vis").removeClass("only");

      } else if (this.startView.model.get("path") == 'tables') {
        this.visualizationsView.hide();
      } else if (this.startView.model.get("path") == 'visualizations') {

        this.tablesView.hide();

        $("article.visualizations").removeClass("no_margin");

        if (this.visualizations.total_entries == 0) {
          this.searchView.hide();
          $(".no_vis").addClass("only");
        } else {
          this.searchView.show();
          $(".no_vis").removeClass("only");
        }
      }

    },

    _fetchUserOnce: function() {

      if (!this.first_time) this.user.fetch();
      this.first_time = false;
      if(dashboard_first_time) {
        cdb.god.trigger('mixpanel', 'Dashboard viewed for the first time');
      }
      cdb.god.trigger('mixpanel', 'Dashboard viewed');
      if (just_logged_in && window.mixpanel) {
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
        this._toggleSearchView();
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

    _toggleSearchView: function() {

      if (this.tables.total_entries == 0) {
        this.searchView.hide();
        return;
      }

      if (this.tables.size() == 0) {

        // there are entries but the server didn't return pages == we're in an empty page,
        // so go to the first one

        this._goto(null, "/tables");
        return;
      }

      this.searchView.show();

    },

    _goto: function(e, where) {
      e && e.preventDefault();
      e && e.stopPropagation();

      if (e && $(e.target).hasClass("disabled")) return;

      this.router.navigate(where, { trigger: true });
    },

    _setupVisualizations: function() {

      var self = this;

      this.visualizationsView = new cdb.admin.dashboard.Visualizations({
        el:             this.$('article.visualizations'),
        user:           this.user,
        visualizations: this.visualizations,
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

      $("section.visualizations .head").append(this.visSortable.render().$el);

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

      this.visualizationsView.bind("removeTag", function(e) {
        self._goto(null, "visualizations");
      }, this);

      // Create vis button
      this.visAside = new cdb.admin.dashboard.Aside({
        el: this.$el.find("article.visualizations aside")
      });

      $(".vis_empty_search .show").on("click", function(e) {
        self._goto(e, "/visualizations");
      });

      $(".vis_empty_search .create").on("click", function(e) {
        e.preventDefault();
        e.stopPropagation();
        self.startView._showVisCreationDialog();
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

      $("section.tables .head").append(this.tablesSortable.render().$el);

      this.tablesView.bind("removeTag", function(e) {
        self._goto(null, "tables");
      }, this);

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

      $(".tables_empty_search .show").on("click", function(e) {
        self._goto(e, "/tables");
      });

      $(".tables_empty_search .create").on("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        self.createTable._showDialog();
      });

    },

    _setupTags: function() {

      var self = this;

      this.filterTag = new cdb.admin.TagDropdown({
        className:         'dropdown tag_dropdown border',
        target:            $(".filter"),
        tags:              this.tags,
        tables:            this.tables,
        visualizations:    this.visualizations,
        host:              this.options.config.account_host,
        vertical_offset:   8,
        horizontal_offset: 5,
        template_base:     'common/views/tag_dropdown'
      });

      this.filterTag.bind("tag", function(opt) {
        var model;

        if (opt.model == 'derived') model = "visualizations";
        else model = "tables";

        self._goto(null, "/" + model + "/tag/" + opt.tag);
      });

      this.$el.append(this.filterTag.render().el);

      cdb.god.bind("closeDialogs", this.filterTag.hide, this.filterTag);

    },

    _setupSearchView: function() {

      this.searchView = new cdb.ui.common.SearchView({
        el: this.$('.search_bar')
      });

      this.searchView.bind('search', this._onSearch, this);

    },

    _setupStartView: function() {
      this.startView = new cdb.admin.dashboard.StartView({
        el:                 this.$el,
        tablesView:         this.tablesView,
        visualizationsView: this.visualizationsView,
        user:               this.user,
        importer:           this.importer,
        config:             this.options.config
      });

      var self = this;

      this.startView.bind("navigate_tables", function() {
        self._goto(null, "/tables");
      }, this);

      this.startView.model.bind("change:path", function() {
        this.startView.current_path = this.startView.model.get("path");
      }, this);

      this.startView.bind("openCreateTableDialog", function(url) {
        self.createTable._showDialog(null, null, url);
      }, this);

    },

    _initViews: function() {

      var self = this;

      // Background Importer
      this.importer = new cdb.ui.common.BackgroundImporter({
        template_base: 'common/views/background_importer'
      });
      this.$el.append(this.importer.render().el);

      // User menu dropdown
      var user_menu = this.user_menu = new cdb.admin.DropdownMenu({
        target:         this.$('a.account'),
        host:           this.options.config.account_host,
        username:       this.options.user_data.username,
        template_base:  'common/views/settings_item'
      });

      cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
      this.$el.append(this.user_menu.render().el);

      this._setupUserStats();
      this._setupSearchView();
      this._setupVisualizations();
      this._setupTables();
      this._setupTags();
      this._setupStartView();

      this._checkActiveImports();

      // global click
      enableClickOut(this.$el);
    },

    _setupUserStats: function() {

      var self = this;

      this.userStats = new cdb.admin.dashboard.UserStats({
        el:    this.$('div.subheader'),
        upgrade_url: this.options.upgrade_url,
        model: this.user,
        tables: this.tables
      });

      this.userStats.render();
      window.userStats = this.userStats;

      this.userStats.bind("gotoVisualizations", function(){
        self._goto(null, "/visualizations");
      }, this);

      this.userStats.bind("gotoTables", function() {
        self._goto(null, "/tables");
      }, this);

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

      // Prevents weird bug with scrolling when the
      if (this.startView.current_path === 'tables' && this.tables && this.tables.length <= 1) return;

      this.tableAside.scroll(ev);
      this.visAside.scroll(ev);
    },

    _onSearch: function(q) {

      var where = this.startView.model.get("what");

      if (q) where = where + "/search/" + q

      this._goto(null, where);
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

