
  /**
   *  Manage which scenario should show, empty-dashboard, table-list,
   *  vis-list, etc.
   *
   *  If the user doesn't have any table, the "dashboard empty article"
   *  will show up, else, the table list will be present, for example.
   *
   *
   *  * It needs a user model and the router to run correctly.
   */

  cdb.admin.dashboard.ControlView = cdb.core.View.extend({

    _VIEWS: [
      'subheader',
      'no_tables',
      'no_vis',
      'no_shared',
      'empty_search',
      'error',
      'visualizations',
      'tables'
    ],

    events: {
      'click a.create_new': '_showDialog',
      'click a.create':     '_showDialog',
      'click a.show':       '_showView'
    },

    initialize: function() {
      this.tables = this.options.tables;
      this.visualizations = this.options.visualizations;
      this.user = this.options.user;
      this.router = this.options.router;

      this.model = new cdb.core.Model({ active: true });

      this._initViews();
      this._initBinds();
    },

    _initViews: function() {
      var welcome = new cdb.admin.WelcomeView({ el: this.$('article.no_tables') });
      this.addView(welcome);
    },

    _initBinds: function() {
      _.bindAll(this, '_showDialog', '_showView');

      this.tables.bind('add remove reset',          this._onDataFetched, this);
      this.visualizations.bind('add remove reset',  this._onDataFetched, this);
      this.router.model.bind('change',              this._onRouterChange, this);

      this.tables.bind('error',         this._onDataError, this);
      this.visualizations.bind('error', this._onDataError, this);

      this.add_related_model(this.tables);
      this.add_related_model(this.visualizations);
      this.add_related_model(this.router.model);
    },


    ///////////////////////
    // Check user limits //
    ///////////////////////

    _setupLimits: function() {
      var user = this.user.toJSON();
      var custom_cartodb = this.options.config.custom_com_hosted;
      var overcome_bytes_quota = ((((user.quota_in_bytes - user.remaining_byte_quota) / user.quota_in_bytes) * 100) >= 100);
      var overcome_tables_quota = (((user.table_count / user.table_quota) * 100) >= 100);

      if (!custom_cartodb &&
        (overcome_bytes_quota || overcome_tables_quota) &&
        user.quota_in_bytes != null &&
        user.quota_in_bytes != 0 &&
        user.table_quota != null &&
        user.table_quota != 0
      ) {
        this.model.set('active', false);
      } else {
        this.model.set('active', true);
      }
    },

    //////////////////////
    // On model changes //
    //////////////////////

    _onRouterChange: function(m, c) {
      // If it changes to a different type (or tables or visualizations)
      // Show the main loader
      if (c && c.changes && c.changes.model) {
        this._showBlock([ 'subheader' ]);
        this._showMainLoader();
      }
      this._scrollToTop();
    },

    _onDataFetched: function() {
      this._setupLimits();
      this._hideMainLoader();
      this._setActiveBlock();
    },

    _onDataError: function(e) {
      this._hideMainLoader();
      this._showBlock(['error']);
    },


    //////////////////////////
    // Visibility functions //
    //////////////////////////

    _scrollToTop: function() {
      this.$el.animate({ scrollTop: 0 }, 550);
    },

    _setActiveBlock: function() {
      var opts = this.router.model.attributes;

      // Tag?
      if (opts.tag) {
        this._showTag();
        return false;
      }

      // Search?
      if (opts.q) {
        this._showSearch();
        return false;
      }

      // Shared?
      if (opts.only_shared) {
        this._showShared();
        return false;
      }

      // Index === default case
      this._showIndex();
    },

    _showIndex: function() {
      var model = this.router.model.get('model');

      // Welcome?
      if (this[model].total_entries === 0) {
        
        if (model === "tables") {
          this._showBlock(['no_tables']);
        } else {
          this._showBlock(['no_vis', 'subheader']);
        }
        
        return false;
      }

      // Show tables/visualizations
      this._showBlock([model, 'subheader']);
    },

    _showSearch: function() {
      // Change empty block key words
      var model = this.router.model.get('model');
      
      if (this[model].total_entries === 0) {
        // Empty results
        this._setTypeBlock('empty_search', model);
        this._showBlock(['empty_search', 'subheader']);
      } else {
        // Show results
        this._showBlock([model, 'subheader']);
      }
      
    },

    _showShared: function() {
      var model = this.router.model.get('model');

      if (!this.user.isInsideOrg()) {
        this._navigateToTables();
        return false;
      }
      
      if (this[model].total_entries === 0) {
        // Empty results
        this._setTypeBlock('no_shared', model);
        this._showBlock(['no_shared', 'subheader']);
      } else {
        // Show results
        this._showBlock([model, 'subheader']);
      }
    },

    _showTag: function() {
      var model = this.router.model.get('model');

      if (this[model].total_entries === 0) {
        // Empty results
        this._setTypeBlock('empty_search', model);
        this._showBlock(['empty_search', 'subheader']);
      } else {
        // Show results
        this._showBlock([model, 'subheader']);
      }
    },

    _showError: function() {
      this._showBlock(['error', 'subheader']);
    },

    _hideBlock: function(name) {
      var self = this;
      _.each(this._VIEWS, function(v) {
        if (name === v) {
          this.$( '.' + v ).removeClass('active');
        }
      });
    },

    _showBlock: function(names) {
      var self = this;
      _.each(this._VIEWS, function(v) {
        self.$( '.' + v )[ _.contains(names,v) ? 'addClass' : 'removeClass' ]('active');
      });
    },

    _hideAllBlocks: function() {
      _.each(this._VIEWS, function(v) {
        this.$( '.' + v ).removeClass('active');
      });
    },


    /////////////////////////////
    // Creation/show functions //
    /////////////////////////////

    _showDialog: function(e) {
      this.killEvent(e);
      var model = this.router.model.get('model');
      
      if (model === "tables") {
        this._showTableCreationDialog();
      } else {
        this._showVisCreationDialog();
      }
    },

    _showView: function(e) {
      this.killEvent(e);
      var model = this.router.model.get('model');

      if (model === "tables") {
        this._navigateToTables();
      } else {
        this._navigateToVis();
      }
    },

    // Show table import/create dialog
    _showTableCreationDialog: function(e) {

      // If view is not active, don't show the dialog
      if (!this.model.get('active')) return false;

      // Check if it has an url to import
      var url;

      if (e && e.target && $(e.target).hasClass('import_example')) {
        url = $(e.target).attr('href');
      }

      this.trigger('openCreateTableDialog', url);
    },

    // Show visualizations create dialog
    _showVisCreationDialog: function() {

      var dlg = new cdb.admin.NewVisualizationDialog({
        user: this.user
      });

      dlg.bind("navigate_tables", this._navigateToTables, this);

      dlg.bind("will_open", function() {
        $("body").css({ overflow: "hidden" });
      }, this);

      dlg.bind("was_removed", function() {
        $("body").css({ overflow: "auto" });
      }, this);

      dlg.appendToBody().open();

    },


    ////////////////////
    // Util functions //
    ////////////////////

    // Change all values from
    // tables > visualizations
    // visualizations > tables
    _setTypeBlock: function(el,type) {
      var html = this.$('.' + el).html();
      var rep = type === "visualizations" ? 'tables' : 'visualizations'
      html = html.replace(new RegExp(rep, "g"), type);
      this.$('.' + el).html(html);
    },

    _navigateToVis: function() {
      this.router.navigate('visualizations', { trigger: true });
    },

    _navigateToTables: function() {
      this.router.navigate('tables', { trigger: true });
    },


    ///////////////////////////
    // Main loader functions //
    ///////////////////////////

    _showMainLoader: function() {
      this.$(".main_loader").show();
    },

    _hideMainLoader: function() {
      this.$(".main_loader").hide()
    }

  });