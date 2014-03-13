/**
 *  Entry point for common data
 */


$(function() {

  var CommonData = cdb.core.View.extend({

    el: document.body,

    initialize: function() {
      this._initModels();
      this._initViews();
    },

    _initModels: function() {
      this.user = new cdb.admin.User(this.options.user_data);
      this.common_tables = new cdb.admin.CommonTables(this.options.common_data);
      this.tables = new cdb.admin.Tables();
      this.first_time = true;

      // The user model has to update every time the table model
      this.tables.bind('add remove reset', function(){
        if (!this.first_time)
          this.user.fetch();

        this.first_time = false;
      }, this);
      this.tables.bind('error', function(e) {
        cdb.log.info("error", e);
      });
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

      // Background Importer
      var bkg_importer = this.bkg_importer = new cdb.ui.common.BackgroundImporter({
        template_base: 'common/views/background_importer'
      });
      this.$el.append(this.bkg_importer.render().el);

      // Create new table view
      var createTable = this.createTable = new cdb.admin.CreateTable({
        el:       this.$el,
        importer: this.bkg_importer,
        tables:   this.tables,
        model:    this.user,
        config:   cdb.config.toJSON()
      });

      // Check imports
      this._checkActiveImports();

      // Common data list
      var common_list = this.common_list = new cdb.admin.CommonTablesView({
        collection: this.common_tables,
        user: this.user,
        el: this.$('table')
      }).bind('create', function(e) {
        createTable.importExample(e);
      }).bind('upgrade', function(e) {
        createTable.showUpgrade(e);
      })
      common_list.render();

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

    // Store JS errors
    var errors = new cdb.admin.ErrorStats({ user_data: user_data });

    // Main view
    var common_data = new CommonData({
      user_data:    user_data,
      common_data:  public_data
    });

    // Mixpanel test
    if (window.mixpanel)
      new cdb.admin.Mixpanel({
        user: user_data,
        token: mixpanel_token
      });

    // Expose to debug
    window.common_data = common_data;
  });

});