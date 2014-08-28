/**
 *  Entry point for common data
 */

cdb.admin.CommonData = {};


$(function() {

  var CommonData = cdb.core.View.extend({

    el: document.body,

    initialize: function() {
      this.user = new cdb.admin.User(this.options.user_data);
      this.common_data = new cdb.admin.CommonData.Collection();
      this.router = this.options.router;

      this._initViews();

      this.common_data.fetch();
    },

    _initViews: function() {
      // User menu
      var user_menu = this.user_menu = new cdb.admin.UserSettingsDropdown({
        target:         $('a.account'),
        model:          this.user,
        template_base:  'common/views/settings_item'
      });
      cdb.god.bind("closeDialogs", user_menu.hide, user_menu);
      this.$el.append(this.user_menu.render().el);

      // Add avatar in dropdown if user comes from an organization
      if (this.user.isInsideOrg()) {
        this.$('a.account.separator')
          .prepend($('<img>').attr('src', this.user.get('avatar_url')))
          .addClass('organization')
      }

      // Background Importer
      var bkg_importer = this.bkg_importer = new cdb.ui.common.BackgroundImporter({
        template_base: 'common/views/background_importer'
      });
      this.$el.append(this.bkg_importer.render().el);

      // Create new table view
      var createTable = new cdb.admin.CreateTable({
        el:       this.$el,
        importer: this.bkg_importer,
        model:    this.user,
        config:   cdb.config.toJSON()
      });

      // Loader
      var loader = new cdb.admin.CommonData.Loader({
        el:         this.$('.main_loader'),
        collection: this.common_data,
        router:     this.router
      });

      // Aside
      var aside = new cdb.admin.CommonData.Aside({
        el:         this.$('aside'),
        collection: this.common_data,
        router:     this.router
      });

      this.addView(aside);

      // Tables
      var tables = new cdb.admin.CommonData.Content({
        el:         this.$('.content'),
        collection: this.common_data,
        router:     this.router
      });

      // Common data list
      // var common_list = this.common_list = new cdb.admin.CommonTablesView({
      //   collection: this.common_tables,
      //   user: this.user,
      //   el: this.$('table')
      // }).bind('create', function(e) {
      //   createTable.importExample(e);
      // }).bind('upgrade', function(e) {
      //   createTable.showUpgrade(e);
      // })
      // common_list.render();

      // Check imports
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
      this.bkg_importer.changeState({ state: "checking" });

      imports.bind("importsFinished", function(e){
        self.bkg_importer.changeState({ state: "complete" });

        $.when(self.tables.fetch()).done(function() {
          self.tables.trigger('forceReload');
        }).fail(function(){
          self.tables.trigger('loadFailed');
        });

        setTimeout(self.bkg_importer.hide, 3000);
        imports.unbind();
      },this).bind("importsFailed", function(imp){
        self.bkg_importer.changeState(imp[0].toJSON());
      },this).bind("importsStart", function(e){
        self.bkg_importer.changeState({ state: "preprocessing" });
      },this).bind("importsEmpty", function(e){
        self.bkg_importer.hide();
        imports.unbind();
      });

      imports.pollCheck();
    }
  });



  cdb.init(function() {

    cdb.templates.namespace = 'cartodb/';
    cdb.config.set(config);

    if (cdb.config.isOrganizationUrl()) {
      cdb.config.set('url_prefix', cdb.config.organizationUrl());
    }

    // Store JS errors
    var errors = new cdb.admin.ErrorStats({ user_data: user_data });

    // Common data router
    var router = new cdb.admin.CommonData.Router();

    // Main view
    var common_data = new CommonData({
      user_data:  user_data,
      router:     router
    });

    // Mixpanel test
    if (window.mixpanel)
      new cdb.admin.Mixpanel({
        user: user_data,
        token: mixpanel_token
      });

    Backbone.history.start({
      pushState:  true,
      root:       cdb.config.prefixUrl() + '/common_data'
    })
  });

});
