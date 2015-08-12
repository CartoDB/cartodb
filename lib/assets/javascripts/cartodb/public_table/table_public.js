
  /**
   *  Table public view
   *
   */

  cdb.open.TablePublic = cdb.core.View.extend({

    _TEXTS: {
      copy_table_dialog: {
        title:   _t('Name for your copy of this table'),
      }
    },

    events: {
      'click .extra_options .clone': '_copyTableToYourAccount'
    },

    initialize: function() {
      this._initModels();
      this._initViews();
      this._initBinds();
    },

    _initModels: function() {
      var self = this;

      // Table
      this.table = new cdb.open.PublicCartoDBTableMetadata({
        id: this.options.table_name,
        name: this.options.table_name,
        description: this.options.vizjson.description || ''
      });

      this.table.set({
        user_name: this.options.user_name,
        vizjson: this.options.vizjson,
        schema: this.options.schema
      });

      this.columns = this.table.data();
      this.sqlView = new cdb.admin.SQLViewData();
      this.sqlView.syncMethod = 'read';

      var query = this.table.data().getSQL()
      this.table.useSQLView(this.sqlView);
      this.sqlView.setSQL(query);
      this.sqlView.options.set('rows_per_page', 20, { silent: true });
      this.sqlView.fetch();

      // User
      this.user = new cdb.admin.User({ username: this.options.user_name });

      // Authenticated user
      this.authenticated_user = new cdb.open.AuthenticatedUser();

    },

    _initViews: function() {
      var self = this;

      // Public header
      if (this.$('.cartodb-public-header').length > 0) {
        var header = new cdb.open.Header({
          el: this.$('.cartodb-public-header'),
          model: this.authenticated_user,
          vis: this.table,
          current_view: this._getCurrentView(),
          owner_username: this.options.owner_username,
          isMobileDevice: this.options.isMobileDevice
        });
        this.addView(header);

        // Fetch authenticated user model
        this.authenticated_user.fetch();
      }

      // Navigation
      this.header = new cdb.open.PublicHeader({
        el: this.$('.navigation'),
        model: this.table,
        user: this.user,
        belong_organization: belong_organization,
        config: this.options.config
      });
      this.addView(this.header);

      // Export options
      if (this.table && !this.options.isMobileDevice) {
        var export_options = new cdb.admin.ExportTableOptions({
          model: this.table,
          config: config,
          sql: 'SELECT * FROM ' + this.table.get('name'),
          user_data: {
            api_key: cdb.config.get('api_key')
          }
        });

        this.$(".extra_options .download_options").append(export_options.render().el);
        this.addView(export_options);
      }

      // Likes
      var like = new cdb.open.LikeView({
        el: this.$el.find(".extra_options .js-like"),
        auto_fetch: true,
        model: new cdb.open.Like({ vis_id: this.options.vizjson.id })
      });

      // Tabpane
      this.workViewTable = new cdb.ui.common.TabPane({
        el: this.$('.pane_table')
      });
      this.addView(this.workViewTable);

      this.workViewMap = new cdb.ui.common.TabPane({
        el: this.$('.pane_map')
      });
      this.addView(this.workViewMap);

      this.workViewMobile = new cdb.ui.common.TabPane({
        el: this.$('.panes_mobile')
      });
      this.addView(this.workViewMobile);

      // Public app tabs
      this.tabs = new cdb.admin.Tabs({
        el: this.$('.navigation ul'),
        slash: true
      });

      this.addView(this.tabs);

      // Help tooltip
      var tooltip = new cdb.common.TipsyTooltip({
        el: this.$("span.help"),
        gravity: $.fn.tipsy.autoBounds(250, 's')
      })
      this.addView(tooltip);

      // Disable comments when browser is IE7
      if ($.browser.msie && parseInt($.browser.version) === 7 ) {
        this.$(".comments .content").html("<p>Your browser doesn't support comments.</p>")
      }

      // Table tab
      this.tableTab = new cdb.open.PublicTableTab({
        model: this.table,
        vizjson: this.options.vizjson,
        user_name: this.options.user_name
      });

      this.tableTabMobile = new cdb.open.PublicTableTab({
        model: this.table,
        vizjson: this.options.vizjson,
        user_name: this.options.user_name
      });

      // Map tab
      this.mapTab = new cdb.open.PublicMapTab({
        vizjson: this.options.vizjson,
        auth_token: this.options.auth_token,
        https: this.options.https,
        vizjson_url: this.options.vizjson_url
      });

      this.mapTabMobile = new cdb.open.PublicMapTab({
        vizjson: this.options.vizjson,
        auth_token: this.options.auth_token,
        https: this.options.https,
        vizjson_url: this.options.vizjson_url
      });

      this.workViewMobile.addTab('table', this.tableTabMobile.render());
      this.workViewMobile.addTab('map', this.mapTabMobile.render());
      this.workViewMobile.bind('tabEnabled:map', this.mapTabMobile.enableMap, this.mapTabMobile);
      this.workViewMap.addTab('tablemap', this.mapTab.render());
      this.workViewTable.addTab('table', this.tableTab.render());

      this.workViewMobile.bind('tabEnabled', function(mode) {

        self.$el.removeClass("table");
        self.$el.removeClass("map");
        self.$el.addClass(mode);
        $(window).trigger('resize');

      }, this.mapTabMobile);

      this.workViewMobile.bind('tabEnabled', this.tabs.activate);
      this.workViewMobile.active('table');

      this.workViewTable.active('map');
      this.workViewMap.active('map');
      this.mapTab.enableMap();

      $(".pane_table")
      .append("<div class='separator_shadow' />");
    },

    _initBinds: function() {
      // Global click
      enableClickOut(this.$el);

      this.authenticated_user.bind('change', this._onUserLogged, this);

      this.add_related_model(this.authenticated_user);
    },

    // Get type of current view
    // - It could be, dashboard, table or visualization
    _getCurrentView: function() {
      var pathname = location.pathname;
      
      if (pathname.indexOf('/tables/') !== -1 ) {
        return 'table';
      }

      if (pathname.indexOf('/viz/') !== -1 ) {
        return 'visualization';
      }

      // Other case -> dashboard (datasets, visualizations,...)
      return 'dashboard';
    },

    keyUp: function(e) {},

    _onUserLogged: function() {
      // Check if edit button should be visible
      if (this.options.owner_username === this.authenticated_user.get('username')) {
        this.$('.extra_options .edit').css('display', 'inline-block');
        this.$('.extra_options .oneclick').css('display', 'none');
      }

    },

    _copyTableToYourAccount: function(e) {
      this.killEvent(e);

      var duplicate_dialog = new cdb.admin.DuplicateTableDialog({
        model: this.table,
        title: this._TEXTS.copy_table_dialog.title
      });

      duplicate_dialog
        .appendToBody()
        .open();
    }

  });
