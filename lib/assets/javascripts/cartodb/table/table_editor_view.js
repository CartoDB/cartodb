cdb.admin.TableEditorView = cdb.core.View.extend({

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

    cdb.admin.hotkeys.enable();
    this.keyBind();
    this._initBinds();
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
    this.authTokens = this.options.vis_data.auth_tokens || [];
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

        // Default basemaps are defined in app_config.yml and
        // lib/assets/javascripts/cartodb/table/default_layers.js
        var tmpLayer = {
          name:        m.name,
          className:   m.className,
          base_type:   m.baseType || 'default',
          urlTemplate: m.urlTemplate,
          minZoom:     m.minZoom,
          maxZoom:     m.maxZoom,
          attribution: m.attribution,
          subdomains:  m.subdomains,
          baseName:    m.baseName,
          style:       m.style ? JSON.parse(m.style): null,
          labels:      m.labels,
          read_only:   true,
          category:    cat
        };

        if (m.tileSize) {
          tmpLayer.tileSize = m.tileSize;
        }

        if (m.zoomOffset) {
          tmpLayer.zoomOffset = m.zoomOffset;
        }

        // Default basemaps are defined in app_config.yml and
        // lib/assets/javascripts/cartodb/table/default_layers.js
        self.baseLayers.add(new BaseType(tmpLayer));
      });
    });

    // Background polling model
    // - It takes care of the background imports and geocodings
    this.backgroundPollingModel = new cdb.editor.BackgroundPollingModel({
      geocodingsPolling: true,
      importsPolling: false
    }, {
      user: this.user,
      vis: this.vis
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
      var viewModel = new cdb.editor.ChangeLockViewModel({
        items: [this.vis],
        contentType: this.vis.isVisualization() ? 'maps' : 'datasets'
      });
      var view = new cdb.editor.ChangeLockView({
        model: viewModel,
        ownerName: this.vis.permission.owner.get('username'),
        isOwner: this.vis.permission.isOwner(this.user),
        template: cdb.templates.getTemplate('common/dialogs/change_lock/templates/unlock_to_editor'),
        clean_on_hide: true,
        enter_to_confirm: true
      });
      var self = this;
      view.cancel = function() {
        window.location = self.user.viewUrl().dashboard()[ self.vis.isVisualization() ? 'maps' : 'datasets' ]().urlToPath('locked');
      };

      view.appendToBody();
    }

    // *** Warning opening Builder maps in the old editor
    if (this.vis.isVisualization() && this.vis.get('uses_builder_features')) {
      var view = new cdb.editor.BuilderFeaturesWarningDialog({
        clean_on_hide: true,
        enter_to_confirm: true
      });
      var self = this;
      view.cancel = function() {
        window.location = self.user.viewUrl().dashboard()[ self.vis.isVisualization() ? 'maps' : 'datasets' ]();
      };

      view.appendToBody();
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

    // If import layer fail, show dialog
    this.backgroundPollingModel.bind('importLayerFail', function(errorMsg) {
      cdb.editor.ViewFactory.createDialogByTemplate('common/templates/fail', { msg: errorMsg })
      .render().appendToBody();
    });

    this.backgroundPollingModel.bind('geocodingCompleted', function(mdl) {
      // Refresh data in order to have cartodb_georef_status column updated
      // but only if current layer data is the geocoded one
      if (this.table && this.table.get('id') === mdl.get('table_name') && this.table.data) {
        this.table.data().refresh()
      }
      // Refresh map
      if (this.mapTab && this.mapTab.updateDataLayerView) {
        this.mapTab.updateDataLayerView()
      }
      // Reload user data in order to have updated info about geocoding quota etc.
      this.user.fetch();
    }, this);

    this.backgroundPollingModel.bind('geocodingFailed', function() {
      // Refresh data in order to have
      // cartodb_georef_status column updated
      if (this.table && this.table.data) {
        this.table.data().refresh()
      }
    }, this);

    this.backgroundPollingModel.bind('importCompleted', function() {
      // Reload user data in order to have updated info about limits etc.
      this.user.fetch();
    }, this);

    // Background polling view!
    var bgPollingView = new cdb.editor.BackgroundPollingView({
      model: this.backgroundPollingModel,
      createVis: false,
      vis: this.vis,
      user: this.user
    });

    this.$el.append(bgPollingView.render().el);
    this.addView(bgPollingView);

  },

  _initTableMap: function() {
    var self = this;


    // Init geocoder
    // TODO: remove when new_modals is enabled for everybody
    this.geocoder = new cdb.admin.Geocoding();

    // New visualization header
    this.header = new cdb.admin.Header({
      el: this.$('header'),
      globalError: this.globalError,
      model: this.master_vis,
      visualization: this.vis,
      user: this.user,
      config: this.options.config,
      geocoder: this.geocoder,
      backgroundPollingModel: this.backgroundPollingModel
    });
    this.addView(this.header);

    // Table tab
    this.tableTab = new cdb.admin.TableTab({
      model: this.table,
      user: this.user,
      vis: this.vis,
      sqlView: this.sqlView,
      geocoder: this.geocoder,
      backgroundPollingModel: this.backgroundPollingModel,
      globalError: this.globalError,
      menu: this.menu
    });

    // Map tab
    this.mapTab = new cdb.admin.MapTab({
      model: this.map,
      authTokens: this.authTokens,
      baseLayers: this.baseLayers,
      vis: this.vis,
      master_vis: this.master_vis,
      geocoder: this.geocoder,
      backgroundPollingModel: this.backgroundPollingModel,
      table: this.table,
      user: this.user,
      menu: this.menu
    });

    // Mamufas view
    this.mamufasView = new cdb.editor.MamufasImportView({
      el: this.$el,
      user: this.user
    }).render();

    if (this.vis.isVisualization()) {
      this.mamufasView.enable();
    }

    this._addVideoPlayer();

    this.map.bind('notice', this.globalError.showError, this.globalError);

    this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);
    this.workView.bind('tabEnabled', this.tabs.activate);
    this.mapTab.bind('missingClick', self.menu.hide, self.menu);

    this.workView.addTab('table', this.tableTab.render(), { active: false });
    this.workView.addTab('map', this.mapTab.render(), { active: false });
    this.workView.active(this.workViewActive);
  },

  _initBinds: function() {
    cdb.god.bind('geocodingChosen', this._onGeocodingChosen, this);
    cdb.god.bind('dialogOpened', function() {
      if (this.vis.isVisualization() && this.mamufasView) {
        this.mamufasView.disable();
      }
      this.backgroundPollingModel && this.backgroundPollingModel.stopPollings();
    }, this);
    cdb.god.bind('dialogClosed', function() {
      if (this.vis.isVisualization() && this.mamufasView) {
        this.mamufasView.enable();
      }
      this.backgroundPollingModel && this.backgroundPollingModel.startPollings();
    }, this);
  },

  _onGeocodingChosen: function(data) {
    this._sendGeocodingMetrics(data.type);

    var geocodeModel;
    if (data.type === 'lonlat') {
      geocodeModel = new cdb.editor.LonLatGeocodingModel({
        table: this.table,
        longitude_column: data.longitude,
        latitude_column: data.latitude,
        force_all_rows: !!data.force_all_rows
      });
    } else {
      geocodeModel = new cdb.editor.GeocodingModel(_.omit(data, 'type'))
    }

    this.backgroundPollingModel.addGeocodingItem(geocodeModel);
  },

  _sendGeocodingMetrics: function(type) {
    // Event tracking "Geocoding"
    cdb.god.trigger('metrics', 'geocoding', {
      email: this.options.user_data.email
    });
  },

  setTable: function(table, sqlView) {
    var self = this;
    if(this.table) {
      this.table.unbind('notice', null, this.globalError);
      this.table.unbind('change:permission', null, this);
    }

    function setPermissions() {
      // check permissions to set read only
      table.setReadOnly(!table.permission.hasWriteAccess(self.user));
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

  // Show big loader when changes to visualization
  // or table
  showLoader: function(type) {
    this.hideLoader();
    this._loader = cdb.editor.ViewFactory.createDialogByTemplate('common/templates/loading', {
      title: 'Setting ' + type,
      quote: cdb.editor.randomQuote()
    });
    this._loader.appendToBody();
  },

  // Hide big loader when visualization
  // or table finishes
  hideLoader: function() {
    if (this._loader) {
      this._loader.close();
      this._loader = null;
    }
  },

  activeView: function(name) {
    this.workView.active(name);
    // table or map is active?
    this.menu.setActiveWorkView(name);
    this.workViewActive = name;
  }
});
