
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
      'click article.no_tables a.create_new': '_showTableCreationDialog',
      'click article.no_vis a.create_new':    '_showVisCreationDialog',
      'click a.import_example':               '_showTableCreationDialog'
    },

    initialize: function() {
      this.$no_tables     = this.$('article.no_tables');
      this.$no_vis        = this.$('article.no_vis');

      this.tables         = this.options.tables;
      this.visualizations = this.options.visualizations;
      this.active         = true;

      this.tables.bind('add remove reset', this._setupStartView, this);
      this.visualizations.bind('add remove reset', this._setupStartView, this);

    },

    /**
     *  Setup start view
     */
    _setupStartView: function() {
      this._decideActiveBlock();
      this._setupLimits();
    },

    /**
     *  Show or hide start view
     */
    _decideActiveBlock: function() {

      var current_route = Backbone.history.fragment;

      var tables_size = this.tables.size();
      var vis_size    = this.visualizations.size();

      this.$no_tables[ tables_size > 0 ? 'removeClass' : 'addClass' ]('active');

      if (tables_size > 0) {
        this.$no_vis[ vis_size > 0 ? 'removeClass' : 'addClass' ]('active');
      } else {
       this.$no_vis.removeClass("active");
      }

      if (current_route == "visualizations") this.$no_tables.removeClass("active");
      else if (current_route == "tables")    this.$no_vis.removeClass("active");

    },

    hideNoVis: function() {
    console.log('hiding');
      this.$no_vis.removeClass("active");
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
     * Show table import/create dialog
     */
    _showTableCreationDialog: function(e) {
      this.killEvent(e);

      // If view is not active, don't show the dialog
      if (!this.active) return false;

      // Check if it has an url to import
      var url;
      if ($(e.target).hasClass('import_example')) {
        url = $(e.target).attr('href');
      }

      // Create a new dialog
      var dlg = new cdb.admin.CreateTableDialog({
        tables : new cdb.admin.Tables(),
        files: null,
        url: url || null,
        quota: (this.options.user.get("remaining_byte_quota") * (this.options.user.get("account_type") != "FREE" ? 3 : 1))
      });

      this.$el.append(dlg.render().el);
      dlg.open();

      dlg.bind('importStarted', this._importStarted, this)
    },

    /**
    * Show visualizations create dialog
    */
    _showVisCreationDialog: function(e) {
      this.killEvent(e);

      // Open popup
      var dlg = new cdb.admin.NewVisualizationDialog({
        visualizations: this.options.visualizations
      });

      dlg.appendToBody().open();
    }

  });
