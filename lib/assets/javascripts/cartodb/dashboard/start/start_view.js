
  /**
   * Manage which scenario should show, empty-dashboard or table-list
   *
   * If the user doesn't have any table, the "dashboard empty article"
   * will show up, else, the table list will be present.
   *
   * Usage example:
   *
   *  var scenario = new cdb.admin.dashboard.StartView({
   *    el: $("body"),
   *    model: model.tables,
   *    user: model.user
   *  });
   *
   *  * It needs a user model to run correctly.
   */

  cdb.admin.dashboard.StartView = cdb.core.View.extend({

    events: {
      //'click section.welcome a.close':        '_hideWelcome',
      'click article.no_tables a.create_new': '_showTableCreationDialog',
      'click article.no_vis a.create_new':    '_showVisCreationDialog',
      'click a.import_example':               '_showTableCreationDialog'
    },

    initialize: function() {

      _.bindAll(this, "_showTableCreationDialog");

      this.$no_tables     = new cdb.admin.StartNoTables({ el: this.$('article.no_tables') });
      this.$no_vis        = this.$('article.no_vis');

      this.tables         = this.options.tablesView.tables;
      this.visualizations = this.options.visualizationsView.visualizations;
      this.active         = true;

      this.user           = this.options.user;

      this.model = new cdb.core.Model();

      this.tables.bind('add reset',         this._setupStartView, this);
      this.visualizations.bind('add reset', this._setupStartView, this);

    },

    /**
     *  Setup start view
     */
    _setupStartView: function() {

      this.tables_size  = this.tables.size();
      this.vis_size     = this.visualizations.size();

      this._decideActiveBlock();
      this._setupLimits();

    },

    /**
     *  Show or hide start view
     */
    _decideActiveBlock: function() {

      $(".empty_search").fadeOut(100);

      var path = this.model.get("path");
      var what = this.model.get("what");

      if      (path == "index")                 this._setupHomeView();
      else if (path == "visualizations")        this._setupVisView();
      else if (path == "tables")                this._setupTablesView();
      else if (path == "tag")    {

        if      (what == 'tables')              this._setupTablesTagsView();
        else if (what == "visualizations")      this._setupVisTagsView();

      }
      else if (path == "search") {

        if      (what == 'tables')         this._setupSearchTablesView();
        else if (what == "visualizations") this._setupSearchVisView();

      }

    },

    _setupHomeView: function() {

      this.$no_tables[ this.tables_size > 0 ? 'deactivate' : 'activate' ]();

      if (this.tables_size > 0) {
        this.$no_vis[ this.vis_size > 0 ? 'removeClass' : 'addClass' ]('active');
      } else {
        this.$no_vis.removeClass("active");
      }

    },

    _setupVisView: function() {
      this.$no_tables.deactivate();
      this.$no_vis[ this.vis_size > 0 ? 'removeClass' : 'addClass' ]('active');
    },

    _setupTablesView: function() {

      this.$no_vis.removeClass("active");

      if (this.tables.total_entries > 0) {
        this.$no_tables.deactivate();
      } else {
        this.$no_tables[ this.tables_size > 0 ? 'deactivate' : 'activate' ]();

        if (this.tables_size == 0)
          $(".subheader").removeClass("active");
      }

    },

    _setupTablesTagsView: function() {

      this.$no_tables.removeClass("active");
      this.$no_vis.removeClass("active");

      if (this.tables.total_entries == 0) {
        $(".vis_empty_search.empty_search").fadeIn(150);
      } else {
        $(".vis_empty_search.empty_search").hide(150);
      }


    },

    _setupVisTagsView: function() {

      this.$no_tables.removeClass("active");
      this.$no_vis.removeClass("active");

      if (this.visualizations.total_entries == 0) {
        $(".vis_empty_search.empty_search").fadeIn(150);
      } else {
        $(".vis_empty_search.empty_search").hide(150);
      }

    },

    _setupSearchTablesView: function() {
      this.$no_tables.deactivate();
      this.$no_vis.removeClass("active");

      if (this.tables.total_entries == 0) {
        $(".tables_empty_search.empty_search").fadeIn(150);
      } else {
        $(".tables_empty_search.empty_search").hide(150);
      }


    },

    _setupSearchVisView: function() {
      this.$no_tables.deactivate();
      this.$no_vis.removeClass("active");

      if (this.visualizations.total_entries == 0) {
        $(".vis_empty_search.empty_search").fadeIn(150);
      } else {
        $(".vis_empty_search.empty_search").hide(150);
      }
    },

    hideNoVis: function() {
      this.$no_vis.removeClass("active");
    },

    _hideWelcome: function() {

    },

    /**
    *  Set limit parameter checking user limitations
    */
    _setupLimits: function() {
      var user = this.options.user.toJSON()
      , custom_cartodb = this.options.config.custom_com_hosted
      , overcome_bytes_quota = ((((user.byte_quota - user.remaining_byte_quota) / user.byte_quota) * 100) >= 100)
      , overcome_tables_quota = (((user.table_count / user.table_quota) * 100) >= 100);

      if (!custom_cartodb &&
        (overcome_bytes_quota || overcome_tables_quota) &&
        user.byte_quota != null &&
        user.byte_quota != 0 &&
        user.table_quota != null &&
        user.table_quota != 0
      ) {
        this.active = false;
      } else {
        this.active = true;
      }
    },

    /**
    *  Start background import
    */
    _importStarted: function(item_queue_id) {

      // Start importer before first polling arrives
      this.options.importer.changeState({state: "preprocessing"});

      var self = this
      , imp = new cdb.admin.Import({ item_queue_id: item_queue_id });

      imp.bind("importComplete", function(e){
        setTimeout(self.options.importer.hide, 3000);
        imp.unbind();
      },this).bind("importError", function(e){
        cdb.log.info(e);
      },this).bind('change:state', function(i) {
        self.options.importer.changeState(i.toJSON());
      },this).bind('change:success', function(i) {
        self.options.importer.changeState(i.toJSON());
      }, this);

      imp.pollCheck();
    },

    /**
    * Show warning if the user can't create tables due to limit
    */
    _showTableSpaceWarning: function() {

      this.warning && this.warning.clean();
      this.warning = new cdb.admin.BaseDialog({
        title: "Disk limit reached",
        description: "You're over the disk limit for this account. Please, <a href='mailto:support@cartodb.com?subject=Disk limit reached'>contact us</a>.",
        template_name: 'common/views/confirm_dialog',
        clean_on_hide: true,
        enter_to_confirm: true,
        ok_button_classes: "right button grey",
        ok_title: "Close",
        cancel_button_classes: "underline hide margin15",
        modal_type: "error",
        width: 500
      });

      this.warning
      .appendToBody()
      .open();

    },

    /**
    * Show table import/create dialog
    */
    _showTableCreationDialog: function(e) {
      this.killEvent(e);

      if (userStats.model.get("limits_space_exceeded")) {
        this._showTableSpaceWarning();
        return false;
      }

      // If view is not active, don't show the dialog
      if (!this.active) return false;

      // Check if it has an url to import
      var url;

      if (e && e.target && $(e.target).hasClass('import_example')) {
        url = $(e.target).attr('href');
      }

      this.trigger('openCreateTableDialog', url);
    },

    /**
    * Show visualizations create dialog
    */
    _showVisCreationDialog: function(e) {
      this.killEvent(e);

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

    _navigateToTables: function() {
      this.trigger("navigate_tables", this);
      this._showTableCreationDialog();
    }

  });
