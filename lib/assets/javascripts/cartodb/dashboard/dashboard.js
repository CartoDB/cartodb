/**
*  The Holy Dashboard
*/

$(function() {

  cdb.admin.dashboard.Dashboard = cdb.core.View.extend({

    events: {},

    initialize: function() {
      cdb.config.set(this.options.config); // import config
      
      this._initModels();
      this._initViews();
      this._initBindings();

      // Fetch user data
      this._fetchUserOnce();
      // Check active imports
      this._checkActiveImports();
      // Global click
      enableClickOut(this.$el);
    },

    _initBindings: function() {
      _.bindAll(this, "_whenScroll", "_fetchUserOnce");
      
      $(document).on("scroll", this._whenScroll);

      this.router.model.bind('change', this._onRouterChange, this);
      this.add_related_model(this.router.model);
    },

    _initModels: function() {
      this.user = new cdb.admin.User(this.options.user_data);
      this.tables = new cdb.admin.Visualizations({ type: "table" });
      this.visualizations = new cdb.admin.Visualizations({ type: "derived" });
      this.router = this.options.router;
      this.model = new cdb.core.Model({ first_time: true });
    },

    _onRouterChange: function(m, changes) {
      this._fetchCollection();
    },

    _fetchCollection: function() {
      var params = this.router.model.attributes;

      this[params.model].options.set({
        q:            params.q,
        page:         params.page || 1,
        tags:         params.tag,
        per_page:     this[params.model]._ITEMS_PER_PAGE,
        only_shared:  params.only_shared,
        updated_at:   params.updated_at,
        created_at:   params.createt_at,
        type:         params.model === "tables" ? 'table' : 'derived'
      });

      this[params.model].fetch();
    },

    _fetchUserOnce: function() {
      if (!this.model.get('first_time')) this.user.fetch();
      
      this.model.set('first_time', false);

      if (dashboard_first_time) {
        cdb.god.trigger('mixpanel', 'Dashboard viewed for the first time')
      }
      
      cdb.god.trigger('mixpanel', 'Dashboard viewed');
      
      if (just_logged_in && window.mixpanel && window.mixpanel.track && window.mixpanel.people) {
        window.mixpanel.track("Logged in");
        window.mixpanel.people.increment("login_count", 1);
      }
    },

    _setupTables: function() {

      var self = this;

      this.tablesView = new cdb.admin.dashboard.Tables({
        el:             this.$('article.tables'),
        tables:         this.tables,
        user:           this.user,
        router:         this.router,
        config:         this.options.config,
        importer:       this.importer
      });

      // this.tablesView.bind('fetch', function() {
      //   self._getTables(false);
      // });

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

      // this.tablesSortable.bind("fetch", function(order) {
      //   self._getTables(false, { type: "table", order: order });
      // });

      this.$("article.tables aside.right > div.content").append(this.tablesSortable.render().el);

      this.tablesPaginator = new cdb.admin.DashboardPaginator({
        el: this.$("article.tables .paginator"),
        what: "tables",
        items: this.tables
      });

      // this.tablesPaginator.bind('viewAll', function() {
      //   self._goto(null, "/tables");
      // });

      // this.tablesPaginator.bind('goToPage', function(page) {
      //   self._goto(null, page);
      // });

      // Create moreDataBar button
      this.moreDataBar = new cdb.admin.dashboard.MoreDataBar({
        router: this.router,
        tables: this.tables
      });
      this.$(".bars").append(this.moreDataBar.render().el);

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

    _initViews: function() {
      var self = this;

      // Dashboard header
      var dashboard_header = new cdb.admin.DashboardHeader({
        el:             this.$('header'),
        tables:         this.tables,
        visualizations: this.visualizations,
        user:           this.user,
        router:         this.router
      });

      // User stats == Subheader
      this.userStats = new cdb.admin.dashboard.UserStats({
        upgrade_url:  this.options.upgrade_url,
        model:        this.user,
        tables:       this.tables,
        router:       this.router
      });

      this.$('div.subheader').append(this.userStats.render().el);
      this.addView(this.userStats);

      // Filter view (search, tags, links...)
      this.filterView = new cdb.ui.common.FilterView({
        visualizations: this.visualizations,
        config:         this.options.config,
        tables:         this.tables,
        user:           this.user,
        router:         this.router
      });
      this.$('div.subheader').after(this.filterView.render().el);

      // Background Importer
      this.importer = new cdb.ui.common.BackgroundImporter({
        template_base: 'common/views/background_importer'
      });
      this.$el.append(this.importer.render().el);
      this.addView(this.importer);

      // Control view!
      // It controls which
      this.control = new cdb.admin.dashboard.ControlView({
        el:                 this.$el,
        visualizations:     this.visualizations,
        tables:             this.tables,
        router:             this.router,
        user:               this.user,
        importer:           this.importer,
        config:             this.options.config
      });

      this.control.bind("openCreateTableDialog", function(url) {
        self.createTable._showDialog(null, null, url);
      }, this);
      this.addView(this.control);

      // Setup visualization view
      this.visualizationsView = new cdb.admin.dashboard.Visualizations({
        el:             this.$('article.visualizations'),
        user:           this.user,
        visualizations: this.visualizations,
        router:         this.router,
        config:         this.options.config
      });

      // Setup all necessary table views
      this._setupTables();
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
      // var model = this.router.model.get('model'); // Tables or visualizations?
      
      // // Prevents weird bug with scrolling
      // if (model === "tables" && this.tables && this.tables.size() <= 1) return;

      // this[ model === "tables" ? 'tableAside' : 'visAside' ].scroll(ev);
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

