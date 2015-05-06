/**
 *  entry point for table
 */


$(function() {

  var Table = cdb.core.View.extend({

    el: document.body,

    events: {
      'keypress': 'keyPress',
      'keyup': 'keyUp'
    },

    initialize: function(options) {
      this.table = null;
      this.selectedMenu = null; // enable this
      this.workViewActive = 'table';
                                      // for oppening a menu in the startup
      // Get user layers as well
      this.options.user_data.get_layers = true;

      this.user = new cdb.admin.User(this.options.user_data);
      cdb.config.set('user', this.user);

      this._initModels();
      this._initViews();
      this._createLoader();

      cdb.admin.hotkeys.enable();
      this.keyBind();

    },

    /**
    * Bind the keystrokes associated with menu actions
    * alt + <- : show right menu
    * alt + -> : hide right menu
    * alt + c : toggle carto
    * alt + s : toggle sql
    * @method keyBind
    */
    keyBind: function() {
      var self = this;
      cdb.god.bind('hotkey:d', function(e) {
        self.menu.isOpen
          ? self.menu.hide()
          : self.menu.show('sql_mod');
      });
      cdb.god.bind('hotkey:s', function(e) {
        self.menu.show('sql_mod');
      })
      cdb.god.bind('hotkey:c', function(e) {
        self.menu.show('style_mod');
      })
    },

    _initModels: function() {
      var self = this;
      this.vis = new cdb.admin.Visualization(this.options.vis_data);
        // when the user changes slides the visualization is changed
        // but we want to keep the master one for tasks that require to use it
      this.master_vis = new cdb.admin.Visualization(_.omit(this.options.vis_data, 'children'));

      this.vis.setMaster(this.master_vis);

      // if slides are available enable first one to fetch the map
      // if not use the master map
      if (this.vis.slides.length === 0) {
        this.vis.map.set(this.vis.map.parse(this.options.map_data));
      } else {
        this.vis.activeSlide(0);
      }

      this.map = this.vis.map;
      this.vis.enableOverlays();


      var layers = this.options.basemaps;

      this.baseLayers = this.user.layers;
      this.baseLayers.each(function(m) {
        m.set('category', 'Yours');
      })

      _(layers).each(function(catLayers, cat) {
        _(catLayers).map(function(m) {
          var baseTypes = {
            'googlemaps': cdb.admin.GMapsBaseLayer
          }
          var BaseType = baseTypes[m.className] || cdb.admin.TileLayer;
            
          self.baseLayers.add(new BaseType({
            name:        m.name,
            className:    m.className,
            base_type:   m.baseType || 'default',
            urlTemplate: m.url,
            read_only:   true,
            minZoom:     m.minZoom,
            maxZoom:     m.maxZoom,
            attribution: m.attribution,
            subdomains: m.subdomains,
            style: m.style ? JSON.parse(m.style): null,
            category: cat
          }));
        });
      });
    },

    _resetModel: function(_id) {
      this.vis = new cdb.admin.Visualization({ id: _id });
      this.vis.fetch();
    },

    _initViews: function() {
      this.globalError = new cdb.admin.GlobalError({
        el: $('.globalerror')
      });
      this.globalError.listenGlobal();
      this.addView(this.globalError);

      // ***  Locked visualization (table or visualization type)?
      if (this.vis.get('locked')) {
        var locked_dialog = new cdb.admin.LockVisualizationDialog({
          user:           this.user,
          model:          this.vis,
          cancelEnabled:  false
        });

        locked_dialog
          .appendToBody()
          .open({ center: true });

        this.addView(locked_dialog);
      }

      // ***  tabs
      this.tabs = new cdb.admin.Tabs({
        el: this.$('nav'),
        slash: true
      });
      this.addView(this.tabs);

      // *** work pane (table and map)
      this.workView = new cdb.ui.common.TabPane({
        el: this.$('.panes')
      });

      this.addView(this.workView);

      // *** right menu
      // We need to provide the master/parent vis to allow creating a new visualization
      // and the regular vis to work with the layers
      this.menu = new cdb.admin.LayersPanel({
        vis: this.vis,
        master_vis: this.master_vis,
        user: this.user,
        globalError: this.globalError
      });

      this.$el.append(this.menu.render().el);
      this.menu.hide();
      this.addView(this.menu);

      this.menu.bind('switch', function(layerView) {
        this.setTable(layerView.table, layerView.sqlView);
        if(!this.tableTab) {
          this._initTableMap();
          this.table.trigger('change', this.table);
        }
        this.backgroundTab.setActiveLayer(layerView);
        this.tableTab.setActiveLayer(layerView);
        this.mapTab.setActiveLayer(layerView);
        this.header.setActiveLayer(layerView);
      }, this);

      // Set watching notifier if needed
      if (!this.vis.isVisualization()) {
        this._setWatchingNotifier();
      }

      // global click
      enableClickOut(this.$el);

      // On resize window...
      $(window).bind("resize", this._onResize);

      if (this.user.featureEnabled('new_modals')) {
        // Used for add layer modal, to handle import of datasets before adding them as layers
        var importsCollection = new cdb.editor.ImportsCollection(null, {
          user: this.user
        });
        var backgroundImporterModel = new cdb.editor.BackgroundImporterModel({}, {
          importsCollection: importsCollection,
          user: this.user,
          vis: this.vis
        });
        backgroundImporterModel.bind('importLayerFail', function(errorMsg) {
          cdb.editor.ViewFactory.createDialogByTemplate('new_common/templates/fail', { msg: errorMsg })
            .render().appendToBody();
        });

        var bgImporterView = new cdb.editor.BackgroundImporterView({
          model: backgroundImporterModel,
          createVis: false,
          items: { fetch: function() {} },
          user: this.user
        });
        this.$el.append(bgImporterView.render().el);
        bgImporterView.enable();
        this.addView(bgImporterView);
      }
    },

    _initTableMap: function() {
      var self = this;


      // Init geocoder
      this.geocoder = new cdb.admin.Geocoding();

      // New visualization header
      this.header = new cdb.admin.Header({
        el: this.$('header'),
        globalError: this.globalError,
        model: this.master_vis,
        visualization: this.vis,
        user: this.user,
        config: this.options.config,
        geocoder: this.geocoder
      });
      this.addView(this.header);

      // Table tab
      this.tableTab = new cdb.admin.TableTab({
        model: this.table,
        user: this.user,
        vis: this.vis,
        sqlView: this.sqlView,
        geocoder: this.geocoder,
        globalError: this.globalError,
        menu: this.menu
      });

      // Map tab
      this.mapTab = new cdb.admin.MapTab({
        model: this.map,
        baseLayers: this.baseLayers,
        vis: this.vis,
        master_vis: this.master_vis,
        geocoder: this.geocoder,
        table: this.table,
        user: this.user,
        menu: this.menu
      });

      // Background tab
      this.backgroundTab = new cdb.admin.BackgroundTab({
        el: this.el,
        model: this.geocoder,
        vis: this.vis,
        table: this.table,
        globalError: this.globalError,
        user: this.user
      });

      // Geocoder result
      var geocoder_result = new cdb.admin.GeocodingResult({
        geocoder: this.geocoder
      });

      this._addVideoPlayer();

      this.addView(geocoder_result);

      this.map.bind('notice', this.globalError.showError, this.globalError);

      this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);
      this.workView.bind('tabEnabled', this.tabs.activate);
      this.mapTab.bind('missingClick', self.menu.hide, self.menu);

      this.workView.addTab('table', this.tableTab.render(), { active: false });
      this.workView.addTab('map', this.mapTab.render(), { active: false });
      this.workView.active(this.workViewActive);
    },


    setTable: function(table, sqlView) {
      var self = this;
      if(this.table) {
        this.table.unbind('notice', null, this.globalError);
        this.table.unbind('change:permission', null, this);
      }

      function setPermissions() {
        // check permissions to set read only
        table.setReadOnly(table.permission.getPermission(self.user) !== cdb.admin.Permission.READ_WRITE);
      }
      table.bind('change:permission', setPermissions, this);
      setPermissions();

      this.table = table;
      this.sqlView = sqlView;
      this.table.bind('notice', this.globalError.showError, this.globalError);
      this.table.bind('change:isSync', this._setSyncInfo, this);
      this._setSyncInfo();
    },

    _addVideoPlayer: function() {

      this.player = new cdb.admin.VideoPlayer();

      if (this.player.hasVideoData()) {
        this.$el.append(this.player.render().$el);
      }

    },

    // Set necessary info if the table is synced
    _setSyncInfo: function() {
      if (this.table && this.table.isSync() && !this.vis.isVisualization()) {
        this.workView.$el.addClass('synced');
      } else {
        this.workView.$el.removeClass('synced');
      }
    },

    _setWatchingNotifier: function() {
      // Create model
      var watchvis_notifier = new cdb.admin.WatchingNotifierModel({}, {
        vis:      this.vis,
        interval: cdb.config.get('watcher_ttl')
      });

      // And then the view
      var watchvis_notifier_view = new cdb.admin.WatchingNotifierView({
        model:  watchvis_notifier,
        user:   this.user
      });

      this.$el.append(watchvis_notifier_view.render().el);
      this.addView(watchvis_notifier_view);
    },

    // Close all dialogs in window resize
    _onResize: function(e) {
      cdb.god.trigger("closeDialogs");
    },

    keyUp: function(e) {},

    keyPress: function(e) {},

    // Big table loader
    _createLoader: function() {
      this.big_loader = new cdb.admin.TableBigLoader();
      this.$el.append(this.big_loader.render().el);
    },

    // Show big loader when changes to visualization
    // or table
    showLoader: function(type) {
      this.big_loader.change(type);
      this.big_loader.open();
    },

    // Hide big loader when visualization
    // or table finishes
    hideLoader: function() {
      this.big_loader.hide();
    },

    activeView: function(name) {
      this.workView.active(name);
      // table or map is active?
      this.menu.setActiveWorkView(name);
      this.workViewActive = name;
    }
  });

  cdb._test = cdb._test || {};
  cdb._test.Table = Table;


  cdb.init(function() {
    cdb.config.set(config);
    cdb.config.set('api_key', user_data.api_key);
    cdb.templates.namespace = 'cartodb/';
    cdb.config.set('url_prefix', user_data.base_url);

    var currentUser = new cdb.admin.User(window.user_data);
    if (currentUser.featureEnabled('active_record_vis_endpoint')) {
      applyPatchNewVisualizationUrl();
    }
    // Store JS errors
    var errors = new cdb.admin.ErrorStats({ user_data: user_data });

    // Main view
    var table = new Table({
      vis_data: vis_data,
      user_data: user_data,
      config: config,
      map_data: map_data,
      basemaps: basemaps || cdb.admin.DEFAULT_BASEMAPS
    });

    // Mixpanel test
    if (window.mixpanel) {
      new cdb.admin.Mixpanel({
        user: user_data,
        token: mixpanel_token
      });
    }

    // expose to debug
    window.table = table;
    window.table_router = new cdb.admin.TableRouter(table);

    Backbone.history.start({
      pushState: true,
      root: cdb.config.prefixUrlPathname() + '/'
    });
  });

});
