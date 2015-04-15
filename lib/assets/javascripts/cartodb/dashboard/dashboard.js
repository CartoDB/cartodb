/**
*  The Holy Dashboard
*/

$(function() {

  cdb.admin.dashboard.Dashboard = cdb.core.View.extend({

    events: {},

    initialize: function() {
      
      this._initModels();
      this._initViews();
      this._initBindings();

      // Fetch user data
      this._fetchUserOnce();
      // Check active imports
      this._checkActiveImports();
      // Global click
      enableClickOut(this.$el);
      // Check problem with "/dashboard" path
      this._checkRoute();
    },

    _initBindings: function() {
      _.bindAll(this, "_whenScroll", "_fetchUserOnce");
      
      $(document).on("scroll", this._whenScroll);

      this.router.model.bind('change', this._onRouterChange, this);
      this.add_related_model(this.router.model);
    },

    _initModels: function() {
      this.user = new cdb.admin.User(this.options.user_data);
      cdb.config.set('user', this.user);
      this.tables = new cdb.admin.Visualizations({ type: "table" });
      this.visualizations = new cdb.admin.Visualizations({ type: "derived" });
      this.router = this.options.router;
      this.model = new cdb.core.Model({ first_time: true });
    },

    _onRouterChange: function(m, changes) {
      this._fetchCollection(m, changes);
    },

    _fetchCollection: function(m, changes) {
      var params = this.router.model.attributes;

      // Get order from localStorage if it is not defined or
      // come from other type (tables or visualizations)
      var storage = new cdb.admin.localStorage(params.model + '.sortable');
      var order = storage.get("order") || 'updated_at';
      delete storage;

      this[params.model].options.set({
        q:              params.q,
        page:           params.page || 1,
        tags:           params.tag,
        per_page:       this[params.model][ "_" + ( params.model === "tables" ? 'TABLES' : 'ITEMS') + '_PER_PAGE'],
        exclude_shared: params.exclude_shared,
        locked:         params.locked,
        order:          order,
        type:           params.model === "tables" ? 'table' : 'derived'
      });

      var order_obj = {};
      order_obj[order] = 'desc';
      this[params.model].fetch({ data: { o: order_obj } });
    },

    _fetchUserOnce: function() {
      if (!this.model.get('first_time')) this.user.fetch();
      
      this.model.set('first_time', false);

      // Mixpanel data
      var d = { account_type: this.user.get('account_type') };
      if (this.user.isInsideOrg()) {
        d.enterprise_org = this.user.organization.get('name');
      }

      if (dashboard_first_time) {
        cdb.god.trigger( 'mixpanel', 'Dashboard viewed for the first time', d)
      }
      
      cdb.god.trigger('mixpanel', 'Dashboard viewed', d);
      
      if (just_logged_in && window.mixpanel && window.mixpanel.track && window.mixpanel.people) {
        window.mixpanel.track("Logged in");
        window.mixpanel.people.increment("login_count", 1);
      }
    },

    _initViews: function() {
      var self = this;

      // Welcome view
      var welcome = new cdb.admin.WelcomeView({
        user:   this.user,
        router: this.router,
        tables: this.tables
      });
      this.$('.no_tables').append(welcome.render().el);
      this.addView(welcome);

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
      this.addView(this.filterView);

      // Background Importer
      this.importer = new cdb.ui.common.BackgroundImporter({
        template_base: 'common/views/background_importer'
      });
      this.$el.append(this.importer.render().el);
      this.addView(this.importer);

      // Control view!
      // It controls which scenario show
      this.control = new cdb.admin.dashboard.ControlView({
        el:                 this.$el,
        visualizations:     this.visualizations,
        tables:             this.tables,
        router:             this.router,
        user:               this.user,
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

      this.visualizationsView.bind('onVisRemoved', function(url) {
        this.control.showBarLoader();
      }, this);

      // Setup all necessary table views
      this.tablesView = new cdb.admin.dashboard.Tables({
        el:       this.$('article.tables'),
        tables:   this.tables,
        user:     this.user,
        router:   this.router,
        config:   this.options.config,
        importer: this.importer
      });

      this.tablesView.bind('openCreateTableDialog', function(url) {
        self.createTable._showDialog(null, null, url);
      });

      this.tablesView.bind('onTableRemoved', function() {
        self.control.showBarLoader();
      });

      // Create table view
      this.createTable = new cdb.admin.CreateTable({
        el:       this.$el,
        importer: this.importer,
        model:    this.user,
        tables:   this.tables,
        router:   this.router,
        config:   this.options.config
      });

      // Reference support address block
      var supportBlock = new cdb.admin.DashboardSupport({
        el: this.$('article.support'),
        model: this.user
      });

      // Create more data view
      var moreDataBar = new cdb.admin.dashboard.MoreDataBar({
        router: this.router,
        tables: this.tables
      });
      this.$(".bars").append(moreDataBar.render().el);
      this.addView(moreDataBar);

      moreDataBar.bind('openCreateTableDialog', function(url) {
        self.createTable._showDialog(null, null, url);
      });
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

    // Due to an issue with our old Backbone-Router version
    // and the trailing slash we have to force to route to
    // 'dashboard/' if it doesn't have a trailing slash at the end :(
    _checkRoute: function() {
      if (window.location.pathname.search('/dashboard/') === -1) {
        var self = this;
        setTimeout(function(){
          self.router.navigate('tables', { trigger: true }) }
        , 500);
      }
    },

    /**
     *  Calculate scroll pagination and moves the asides when needed
     */
    _whenScroll: function(ev) {
      var model = this.router.model.get('model'); // Tables or visualizations?
      this[ model === "tables" ? 'tablesView' : 'visualizationsView' ].onScroll(ev);
    }

  });


  cdb.init(function() {
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(config); // import config
    cdb.config.set('url_prefix', user_data.base_url);

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

    Backbone.history.start({
      pushState:  true,
      root:       cdb.config.prefixUrlPathname() + '/dashboard/'
    })
  });

});

