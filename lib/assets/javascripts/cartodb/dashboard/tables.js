
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

      - When delete a table show the red block.
      - Specs.
  */

  cdb.admin.dashboard.Tables = cdb.core.View.extend({

    events: {
      'click a.create_new': '_showCreationDialog',
      'click .remove':      '_removeTag'
    },

    initialize: function() {
      // User can create tables
      this.active = true;

      this.tables = this.options.tables;

      this.template = cdb.templates.getTemplate('dashboard/views/tables');
      this.render();

      this.user = this.options.user;

      this._initViews();
      this._bindEvents();
    },

    render: function() {
      this.$el.append(this.template());
      return this;
    },

    _initViews: function() {

      var self = this;

      _.bindAll(this, "_changeTitle");

      // Tables list
      this.tableList = new cdb.admin.dashboard.TableList({
        el:         this.$('#tablelist'),
        collection: this.tables,
        config:     this.options.config,
        user:       this.options.user
      });

      this.model = new Backbone.Model({
        show_default_title: true,
        default_title: "Recent tables"
      });

      this.tableList.bind("remove", this._onRemove, this);
      this.tableList.bind("showLoader", this.showLoader, this);

      this.add_related_model(this.model);
      this.addView(this.tableList);
    },

    _bindEvents: function() {
      this.tables.bind('add reset', this._setupTablesView, this);

      this.model.on("change:show_default_title", this._changeTitle, this);
      this.model.on("change:padding",            this._changePadding, this);

      this.user.on("change:quota_in_bytes change:table_count", this._setupLimits, this);
    },

    _onRemove: function() {

      this.tables.options.set({ type: "table" });
      this.trigger("fetch", this);
    },

    /**
     *  Setup tables view
     */
    _setupTablesView: function() {
      this._changeTitle();
      this._decideActiveBlock();
      this._setupLimits();
      this.hideLoader();
    },

    showDefaultTitle: function(show) {
      this.model.set("show_default_title", show);
    },

    showLoader: function() {
      this.$el.find(".loader").show();
    },

    hideLoader: function() {
      this.$el.find(".loader").hide();
    },

    /**
    *  Change element padding
    */
    _changePadding: function() {

      if (this.model.get("padding")) this.$el.removeClass("no_padding");
      else this.$el.addClass("no_padding");

    },

    _changeTitle: function() {

      var title = "";

      var preview_items_count = this.tables._PREVIEW_ITEMS_PER_PAGE;

      if (this.tables.options.get("type") == 'table') preview_items_count = this.tables._PREVIEW_TABLES_PER_PAGE;

      if (this.tables.options.get("per_page") == preview_items_count) {
        title = this.model.get("default_title");
      }  else {

        var q     = this.tables.options.get("q");
        var tag   = this.tables.options.get("tags");
        var count = this.tables.total_entries;

        if (tag) {
          title = count + " table" + ( count != 1 ? "s" : "") + " with the tag <a class='remove' href='#remove'>" + tag + "</a>";
        } else if (q) {
          title = count + " table" + ( count != 1 ? "s" : "") + " with <a class='remove' href='#'>" + q + "</a> found";
        } else {
          title = count + " table" + ( count != 1 ? "s" : "") + " created";
        }

      }

      this.$("h2 span").html(title);

    },

    /**
     *  Set limit parameter checking user limitations
     */
    _decideActiveBlock: function() {

      var active  = this.tables.size() > 0;
      var preview = this.tables.options.get("per_page") == this.tables._PREVIEW_ITEMS_PER_PAGE;

      this.$el[ preview ? 'addClass' : 'removeClass' ]('view_all');
      this.$el[ active  ? 'addClass' : 'removeClass' ]('active');
    },

    _removeTag: function(e) {
      e.preventDefault();
      e.stopPropagation();

      this.trigger("removeTag", this);
    },

    hide: function() {
      this.$el.removeClass("active");
    },

    /**
     *  Set limit parameter checking user limitations
     */
    _setupLimits: function() {
      var user = this.options.user.toJSON()
        , custom_cartodb = this.options.config.custom_com_hosted
        , overcome_bytes_quota = ((((user.quota_in_bytes - user.remaining_byte_quota) / user.quota_in_bytes) * 100) >= 100)
        , overcome_tables_quota = (((user.table_count / user.table_quota) * 100) >= 100);

      if (!custom_cartodb &&
          (overcome_bytes_quota || overcome_tables_quota) &&
          user.quota_in_bytes != null &&
          user.quota_in_bytes != 0 &&
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
      if (!this.active) return false;

      cdb.god.trigger('mixpanel', "Open create table");
      this.trigger('openCreateTableDialog');
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
