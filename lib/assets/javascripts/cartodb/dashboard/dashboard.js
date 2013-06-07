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

      this.router.bind("index",          this._index,          this);
      this.router.bind("tables",         this._tables,         this);
      this.router.bind("visualizations", this._visualizations, this);
      this.router.bind("search",         this._search,         this);
      this.router.bind("tag",            this._tag,            this);

    },

    _initBindings: function() {

      var self = this;

      _.bindAll(this, "_goto", "_whenScroll");

      $(document).on("scroll", this._whenScroll);

      $("header li a.tables, article.tables .view_all").on("click",                 function(e) { self._goto(e, "/tables"); });
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

      this.tables.bind('add remove reset', this._onTablesFetch, this);
      this.visualizations.bind("reset", this._onVisFetch, this);

      this.tables.bind('error', function(e) {
        cdb.log.info("error", e);
      });

    },

    _index: function() {

      $("body").animate({ scrollTop: 0 }, 550);

      this.startView.model.set("path", "index");
      this.searchView.setQuery();

      this.searchView.model.set("visible", false);

      // Visualizations
      this.visualizationsView.showDefaultTitle(true);
      this.visualizations.options.set({ q: "", tags: "", per_page: this.visualizations._PREVIEW_ITEMS_PER_PAGE });
      this.visualizationsView.showLoader();

      var order = this.visSortable.getSortHash();
      this.visualizations.fetch(order);

      // Tables
      this.tablesView.showDefaultTitle(true);
      this.tablesView.showLoader();
      this.tablesView.model.set("padding", false);

      this.tables.options.set({ q: "", tags: "", per_page: this.tables._PREVIEW_TABLES_PER_PAGE, type: "table", order: this.tablesSortable.getSortMethod() });

      var order = this.tablesSortable.getSortHash();
      this.tables.fetch(order);

      // Tags
      this.filterTag.model.set({ type: "" });

    },

    _tables: function(page) {

      $("body").animate({ scrollTop: 0 }, 550);

      this.searchView.setQuery();
      this.visualizationsView.hide();

      this.startView.model.set({path: "tables", what: "tables" });

      // Tables
      this.tables.options.set({ q: "", page: page || 1, tags: "", per_page: this.tables._TABLES_PER_PAGE, type: "table", order: this.tablesSortable.getSortMethod() });
      this.tablesView.showLoader();
      this.tablesView.model.set("padding", true);

      var order = this.tablesSortable.getSortHash();
      this.tables.fetch(order);

      this.tablesView.showDefaultTitle(false);

      this.filterTag.model.set({ type: "table", name: "" });

    },

    _visualizations: function(page) {

      $("body").animate({ scrollTop: 0 }, 550);
      this.searchView.setQuery();

      this.startView.model.set({ path: "visualizations", what: "visualizations" });

      // Tables
      this.tablesView.hide();

      // Visualizations
      this.visualizationsView.showLoader();
      this.visualizations.options.set({ q: "", page: page || 1, tags: "", per_page: this.visualizations._ITEMS_PER_PAGE, type: "derived" });
      this.visualizationsView.showLoader();

      var order = this.visSortable.getSortHash();
      this.visualizations.fetch(order);

      this.visualizationsView.showDefaultTitle(false);

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

        this.visualizationsView.showDefaultTitle(true);
        this.visualizations.options.set({ q: q, page: page || 1, tags: "", per_page: this.visualizations._ITEMS_PER_PAGE, type: "derived" });
        this.visualizationsView.showLoader();

        var order = this.visSortable.getSortHash();
        this.visualizations.fetch(order);

      } else if (model == 'tables') {

        this.visualizationsView.hide();

        this.tablesView.showDefaultTitle(true);
        this.tables.options.set({ q: q, page: page || 1, tags: "", per_page: this.tables._TABLES_PER_PAGE, type: "table", order: this.tablesSortable.getSortMethod() });
        this.tablesView.showLoader();
        this.tablesView.model.set("padding", true);

        var order = this.tablesSortable.getSortHash();

        this.tables.fetch(order);
      }

    },

    _tag: function(opts) {

      var model = opts.model;
      var page  = opts.page;
      var tag   = opts.tag;

      this.searchView.setQuery();

      this.startView.model.set({ path: model, what: model });

      this.searchView.model.set("visible", true);

      if (model == 'visualizations') {

        this.tablesView.hide();

        this.visualizationsView.showDefaultTitle(true);
        this.visualizations.options.set({ q: "", page: page || 1, tags: tag, per_page: this.visualizations._ITEMS_PER_PAGE, type: "derived" });
        this.visualizationsView.showLoader();

        var order = this.visSortable.getSortHash();
        this.visualizations.fetch(order);

        this.filterTag.model.set({ type: "derived", name: tag });

      } else if (model == 'tables') {

        this.visualizationsView.hide();

        this.tablesView.showDefaultTitle(true);
        this.tables.options.set({ q: "", page: page || 1, tags: tag, per_page: this.tables._TABLES_PER_PAGE, type: "table", order: this.tablesSortable.getSortMethod() });
        this.tablesView.showLoader();
        this.tablesView.model.set("padding", true);

        var order = this.tablesSortable.getSortHash();
        this.tables.fetch(order);

        this.filterTag.model.set({ type: "table", name: tag });

      }

    },

    _onVisFetch: function() {

      // Enable/disable visualization link in the header
      if (this.visualizations.total_entries == 0 && this.tables.total_entries == 0) {
        $("header ul .visualizations").addClass("disabled");
      } else {
        $("header ul .visualizations").removeClass("disabled");
      }

      if (this.startView.model.get("path") == 'index') {

        $(".no_vis").removeClass("only");
        $("article.visualizations").addClass("no_margin");

        if (this.visualizations.total_entries > 0 && this.tables.total_entries > 0) {
          $("article.visualizations").addClass("no_margin");
        }

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

    _onTablesFetch: function() {

      if (!this.first_time) this.user.fetch();
      this.first_time = false;

      if (this.startView.model.get("path") == 'visualizations') {
        this.tablesView.hide();
      } else if (this.startView.model.get("path") == 'tables') {

        this.visualizationsView.hide();

        if (this.tables.total_entries == 0) {

          this.searchView.hide();

        } else {

          if (this.tables.size() == 0) {
            // there are entries but the server didn't return pages == we're in an empty page,
            // so go to the first one
            this._goto(null, "/tables");
          } else this.searchView.show();

        }
      }

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

      // TODO: rename this thing
      var createTable = new cdb.admin.CreateTable({
        el:       $("body"),
        importer: this.importer,
        tables:   this.tables,
        model:    this.user,
        config:   this.options.config
      });

      // Refresh the list of visualizations when a table is removed
      this.tables.bind("remove", function() {
        self.visualizations.fetch();
      }, this);

      this.tablesSortable = new cdb.admin.Sortable({
        what: "tables",
        items: this.tables
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

        self.startView._showTableCreationDialog();
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

      // User data
      this.user_stats = new cdb.admin.dashboard.UserStats({
        el:    this.$('div.subheader'),
        upgrade_url: this.options.upgrade_url,
        model: this.user
      });

      this.user_stats.render();

      this._setupSearchView();
      this._setupVisualizations();
      this._setupTables();
      this._setupTags();
      this._setupStartView();

      this._checkActiveImports();

      // global click
      enableClickOut(this.$el);
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

    var dashboard = new cdb.admin.dashboard.Dashboard({
      el:          document.body,
      user_data:   user_data,
      upgrade_url: upgrade_url,
      config:      config,
      router:      router
    });

    // TODO: REMOVE THIS
    window.dashboard = dashboard;

    Backbone.history.start({ pushState: true, root: "/dashboard/"})

  });

});
