
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

  cdb.admin.dashboard.Tables = cdb.core.View.extend({

    events: {
      'click a.create_new': '_showCreationDialog'
    },

    initialize: function() {
      // Model to check if user can create tables
      this.model = new cdb.core.Model({ active: true });

      this.tables = this.options.tables;
      this.user = this.options.user;
      this.router = this.options.router;

      this.template = cdb.templates.getTemplate('dashboard/views/tables');
      this.render();

      this._initViews();
      this._initBinds();
    },

    render: function() {
      this.$el.append(this.template());
      return this;
    },

    _initViews: function() {

      // Tables list
      this.tableList = new cdb.admin.dashboard.TableList({
        el:         this.$('#tablelist'),
        collection: this.tables,
        config:     this.options.config,
        router:     this.options.router,
        user:       this.user
      });

      this.addView(this.tableList);

      // Sort tables
      var sort_tables = new cdb.admin.Sortable({
        what: "tables",
        items: this.tables
      });
      sort_tables.bind("sortChanged", this._onSortChanged, this);
      this.$("aside.right > div.content").append(sort_tables.render().el);
      this.addView(sort_tables);

      // Tables paginator
      var tables_paginator = new cdb.admin.DashboardPaginator({
        el: this.$(".paginator"),
        what: "tables",
        items: this.tables
      });
      tables_paginator.bind('goToPage', this._navigateTo, this);

      // Create table button
      this.tableAside = new cdb.admin.dashboard.Aside({
        el: this.$("aside")
      });

    },

    _initBinds: function() {
      this.tables.bind('add remove reset', this._setupTablesView, this);
      this.user.on("change:quota_in_bytes change:table_count", this._setupLimits, this);
      this.router.model.bind('change', this._onRouterChange, this);

      this.add_related_model(this.tables);
      this.add_related_model(this.user);
      this.add_related_model(this.router.model);
    },

    onScroll: function(ev) {
      this.tableAside.scroll(ev);
    },

    _onSortChanged: function() {
      this.router.model.trigger('change', this.router.model, {});
    },

    /**
     *  Setup tables view
     */

    _onRouterChange: function(mdl, changes) {
      var params = this.router.model.attributes;

      if (params.model === "tables" && !changes.model) {
        this._showLoader();
      } else {
        this._hideLoader();
      }
    },

    _setupTablesView: function() {
      this._setupLimits();
      this._hideLoader();
      this._setCreateButton();
    },

    _showLoader: function() {
      this.$(".loader").show();
    },

    _hideLoader: function() {
      this.$(".loader").hide();
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
        this.model.set('active', false);
      } else {
        this.model.set('active', true);
      }
    },

    /**
     *  Setup creation button, activate or disable it
     */
    _setCreateButton: function() {
      this.$("aside .create_new")[this.model.get('active') ? 'removeClass' : 'addClass' ]("grey disabled");
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

    _navigateTo: function(page) {
      var params = this.router.model.attributes;
      var action = ''; 
      var val = '';

      if (page) {
        page = page.replace(/\//g,'');
      } else {
        page = params.page;
      }

      if (params.tag || params.q) {
        action = params.tag ? 'tag' : 'search';
        val = params.tag || params.q;
      }

      var path = params.model + ( params.only_shared ? '/shared' : '' ) + ( action ? ('/' + action + '/' + val) : '' ) + ( '/' + page);
      this.router.navigate(path, { trigger: true });
    },

    /**
     * Show import/create dialog or upgrade dialog if user reachs limits
     */
    _showCreationDialog: function(e) {
      this.killEvent(e);

      // If view is not active, don't show the dialog
      if (!this.model.get('active')) return false;

      cdb.god.trigger('mixpanel', "Open create table");
      this.trigger('openCreateTableDialog');
    }

  })
