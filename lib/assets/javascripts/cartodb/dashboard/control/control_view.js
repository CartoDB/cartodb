
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
      'more_data',
      'visualizations',
      'tables',
      'error'
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

      this._initBinds();
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
        this.showMainLoader();
        this.hideBarLoader();
      } else {
        this.hideMainLoader();
        this.showBarLoader();
      }
      this._scrollToTop();
    },

    _onDataFetched: function() {
      var opts = this.router.model.attributes;

      // Check if user has visited a page without results
      // or it doesn't exist.
      if (this[opts.model].total_entries > 0 && this[opts.model].size() === 0 && opts.page !== 0) {
        this[ opts.model === "tables" ? '_navigateToTables' : '_navigateToVis']();
        return false;
      }

      this._setupLimits();
      this._setActiveBlock();

      // Hide loaders
      this.hideMainLoader();
      this.hideBarLoader();
    },

    _onDataError: function(col, e, opts) {
      // Old requests can be stopped, so aborted requests are not
      // considered as an error
      if (!e || (e && e.statusText !== "abort")) {
        this.hideMainLoader();
        this.hideBarLoader();
        this._showBlock(['subheader', 'error']);
      }
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

      // Only mine?
      if (opts.exclude_shared) {
        this._showMine();
        return false;
      }

      // Index === default case
      this._showIndex();
    },

    _showIndex: function() {
      var model = this.router.model.get('model');
      var visible_blocks = [ model, 'subheader' ];

      // Welcome?
      if (this[model].total_entries === 0) {
        visible_blocks = _.without(visible_blocks, model);

        // If user wants to see locked visualizations or tables
        if (this.router.model.get('locked')) {
          if (model === "tables") {
            this._navigateToTables()
          } else {
            this._navigateToVis()
          }
          return false;
        }
        
        if (model === "tables") {
          visible_blocks = _.without(visible_blocks, 'subheader');
          visible_blocks.push('no_tables');
        } else {
          visible_blocks.push('no_vis', 'subheader');
        }

      }

      // Check if it is necessary to show more data
      if (model === "tables" && this[model].total_entries < 4 && this[model].total_entries > 0) {
        visible_blocks.push('more_data');
      }

      // Show tables/visualizations
      this._showBlock(visible_blocks);
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

    _showMine: function() {
      var model = this.router.model.get('model');

      if (!this.user.isInsideOrg()) {
        this._navigateToTables();
        return false;
      }
      
      if (this[model].total_entries === 0) {

        // If user wants to see locked visualizations or tables
        if (this.router.model.get('locked')) {
          if (model === "tables") {
            this._navigateToTables()
          } else {
            this._navigateToVis()
          }
          return false;
        }
        
        // Show empty section
        var sections = ['no_tables'];
        if (model === 'visualizations') {
          sections = ['no_vis', 'subheader'];
        }
        this._showBlock(sections);
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

    // Make a block or some visible
    // It accepts an array
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
      var rep = type === "visualizations" ? 'table' : 'visualization'
      html = html.replace(new RegExp(rep, "g"), type.substr(0, ( type.length - 1 )));
      this.$('.' + el).html(html);
    },

    _navigateToVis: function() {
      this.router.navigate('visualizations', { trigger: true });
    },

    _navigateToTables: function() {
      this.router.navigate('tables', { trigger: true });
    },


    ///////////////////////////
    // Loader functions //
    ///////////////////////////

    showBarLoader: function() {
      this.$(".bar_loader").addClass('active');
    },

    hideBarLoader: function() {
      this.$(".bar_loader").removeClass('active');
    },

    showMainLoader: function() {
      this.$(".main_loader").show();
    },

    hideMainLoader: function() {
      this.$(".main_loader").hide()
    }

  });