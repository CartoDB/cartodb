
  /**
   *  Tables block view, it encompasses...:
   *  
   *  - Tables list
   *  - Tables aside (create new vis)
   *
   *  It needs:
   *  
   *  - Tables collection
   *  - User model
   *  - App config object
   *  - Background importer
   *
   *  An example:
   *    
   *  var tablesView = new cdb.admin.dashboard.Tables({
   *    el:         $('article.tables'),
   *    collection: tables,
   *    user:       user,
   *    config:     config,
   *    importer:   importer
   *  });
   */


  /*
    TODO list:

      - Order tables by created_at / updated_at.
      - Compress the tables list.
      - When delete a table show the red block.
      - Delete dialog with export options.
      - Show loader when load tables.
      - Improve styles.
      - Specs.
  */

  cdb.admin.dashboard.Tables = cdb.core.View.extend({
    
    events: {
      'click a.create_new': '_showCreationDialog'
    },

    initialize: function() {
      // User can create tables
      this.active = true;

      this._initViews();
      this._bindEvents();
    },

    _initViews: function() {
      // Tables list
      this.tableList = new cdb.admin.dashboard.TableList({
        el:         this.$('#tablelist'),
        collection: this.options.tables,
        config:     this.options.config,
        user:       this.options.user
      });

      this.addView(this.tableList);
    },

    _bindEvents: function() {
      this.options.tables.bind('add remove reset', this._setupTablesView, this);
    },

    /**
     *  Setup tables view
     */
    _setupTablesView: function() {
      this._updateHeader();
      this._decideActiveBlock();
      this._setupLimits();
    },

    /**
     *  Set limit parameter checking user limitations
     */
    _updateHeader: function() {
      var count = this.options.tables.size();
      this.$("h2").text(count + " table" + ( count != 1 ? "s" : "") + " created");
    },

    /**
     *  Set limit parameter checking user limitations
     */
    _decideActiveBlock: function() {
      var tables = this.options.tables.size()
        , active = tables > 0;

      this.$el[ active ? 'addClass' : 'removeClass' ]('active');
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

      this._setCreateButton();
    },

    /**
     *  Setup creation button, activate or disable it
     */
    _setCreateButton: function() {
      this.$(".create_new")[this.active ? 'removeClass' : 'addClass' ]("grey disabled");
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
     * Show import/create dialog or upgrade dialog if user reachs limits
     */
    _showCreationDialog: function(e) {
      this.killEvent(e);

      // If view is not active, don't show the dialog
      if (!this.active) {
        // If it is a custom CartoDB install, don't show any upgrade window
        if (this.options.config && !this.options.config.custom_com_hosted)
          this._showUpgradeDialog();
        return false;
      }

      // Create a new dialog
      var dlg = new cdb.admin.CreateTableDialog({
        tables : this.options.tables,
        files: null,
        url: null,
        quota: (this.options.user.get("remaining_byte_quota") * (this.options.user.get("account_type") != "FREE" ? 3 : 1))
      });

      this.$el.append(dlg.render().el);
      dlg.open();

      dlg.bind('importStarted', this._importStarted, this)
    },

    /**
     *  Show upgrade window
     */
    _showUpgradeDialog: function() {
      var dlg = new cdb.admin.UpgradeDialog({
            model: this.options.user,
            config: this.options.config
          });

      this.$el.append(dlg.render().el);

      dlg.open();
    }
  })