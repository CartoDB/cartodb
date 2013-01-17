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
      var self = this;
      this.selectedMenu = null; // enable this
                                      // for oppening a menu in the startup
      // Get user layers as well
      this.options.user_data.get_layers = true;

      this.user = new cdb.admin.User(this.options.user_data);

      _.bindAll(this, "noGeoRefMapMenu", "geoRefMapMenu");

      this._initModels();
      this._initViews();

      // init data
      // table change will raise the map and columns fetch

      this.table.bind('change:name', function(ev) {
        document.title = this.get("name") + ' | CartoDB';
      });

      // trigger a manual change to all the widgets get updated
      this.table.trigger('change', this.table);

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
        self.menu.isOpen?
          self.menu.hide():
          self.openRightMenu(e);
      });
      cdb.god.bind('hotkey:s', function(e) {
        self.menu.show('sql_mod');
      })
      cdb.god.bind('hotkey:c', function(e) {
        self.menu.show('style_mod');
      })
    },

    openRightMenu: function(e) {
      //TODO: not use click, use the right method to do it
      /*this.menu.activeSection === 'table' ?
        this.menu.getButtonByClass('sql_mod').click(e):
        this.menu.show();
        */
    },

    applyQuery: function(sql) {
      var self = this;
      // setSQL raise the fetch
      self.table.useSQLView(self.sqlView);
      self.sqlView.setSQL(sql, { silent: true });
      // if there is some error the query is rollbacked
      self.sqlView.fetch();
    },

    _initModels: function() {
      var self = this;
      this.table = new cdb.admin.CartoDBTableMetadata(
        this.options.table_data
      );
      this.columns = this.table.data();
      this.map = new cdb.admin.Map();
      this.map.set(this.map.parse(this.options.map_data));
      this.sqlView = new cdb.admin.SQLViewData();
      this.geocoder = new cdb.admin.Geocoding('', this.table);

      var layers = cdb.admin.DEFAUL_LAYERS;
      this.baseLayers = this.user.layers;
      _(layers).map(function(m) {

        self.baseLayers.add(new cdb.admin.TileLayer({
          name:        m.name,
          className:   m.className,
          base_type:   m.className,
          urlTemplate: m.url,
          read_only:   true,
          maxZoom:     m.maxZoom,
          attribution: m.attribution
        }));

      });


      this.map.bind('change:dataLayer', _.once(function() {

        var setupQuery = false;

        // cache the value to access it in all the view
        self.dataLayer = self.map.get('dataLayer');
        self.sqlView.dataLayer = self.dataLayer;

        var sql = self.table.isInSQLView() ?
-                      self.table.data().getSQL() :
-                      undefined;

        self.dataLayer.set({
          table_name: self.table.get('name'),
          user_name: self.user.get("username"),
          sql: sql,
          sql_api_domain: cdb.config.get('sql_api_domain'),
          sql_api_endpoint: cdb.config.get('sql_api_endpoint'),
          sql_api_port: cdb.config.get('sql_api_port'),
          tiler_domain: cdb.config.get('tiler_domain'),
          tiler_port: cdb.config.get('tiler_port'),
          no_cdn: true
        });

        // set api key
        var e = self.dataLayer.get('extra_params') || {};
        e.map_key = self.user.get('api_key');
        self.dataLayer.set('extra_params', e);

        // when the layer query changes the table should change
        self.dataLayer.bind('change:query', function() {

          var sql = this.get('query');

          if(sql) {
            self.applyQuery(sql);
            var ro = self.dataLayer.get('read_only')
            self.sqlView.readOnly =  ro == undefined ? true: ro;
          } else {
            self.table.useSQLView(null);
          }
          self.dataLayer.unset('read_only', {silent: true});
        });

        // on error rollback the query in the model
        self.sqlView.bind('error', function() {
          self.sqlView.reset([]);
          self.dataLayer.save({query: null}, {silent: true});
          setupQuery = false;
        });

        // on success and no modify rows save the query!
        self.sqlView.bind('reset', function() {
          if(self.sqlView.modify_rows) {
            self.dataLayer.set({query: null});
            self.table.useSQLView(null);
            self.dataLayer.invalidate();
          } else {
            // if setupQuery = true means this query is the first
            // executed when the table is loaded and it doesn't need
            // to be saved
            if(!setupQuery) {
              self.dataLayer.save(null, { silent: true });
            }
            setupQuery = false;
            self._readOnlyTableButtons();
          }

          self.updateQueryInfo();

          return;
        });

        // trigger the event to ping all views
        self.dataLayer.trigger('change:query');
        if(self.dataLayer.get('query')){
          setupQuery = true;
        }



        self.dataLayer.bind('tileError parseError', function() {
          if(self.workView.activeTab == 'map') {
            self.globalError.showError('There is a problem with the map tiles. Please, check your CartoCSS style.', 'error', 0);
          }
        }, self.globalError)

        self.dataLayer.bind('error', function() {
          if(self.workView.activeTab == 'map') {
            self.globalError.showError('There is a problem with the tiles server.', 'error', 0);
          }
        }, self.globalError)

        self.dataLayer.bind('tileOk', function() {
          self.globalError.hide();
        }, this);


        self.table.bind('columnRename columnDelete columnAdded geolocated', function() {
          self.dataLayer.invalidate();
        });


        self.sqlView.bind('reset', function() {

        }, this);



      }));

    },

    _initViews: function() {
      var self = this;

      this.globalError = new cdb.admin.GlobalError({
        el: $('.globalerror')
      });
      this.globalError.listenGlobal();

      this.header = new cdb.admin.Header({
        el: this.$('header'),
        globalError: this.globalError,
        model: this.table,
        user: this.user,
        config: this.options.config,
        user_data: this.options.user_data,
        geocoder: this.geocoder,
        map: this.map
      });
      this.addView(this.header);

      this.header.bind('clearSQLView', this._clearSQLView, this);

      this.tabs = new cdb.admin.Tabs({
        el: this.$('nav'),
        slash: true
      });
      this.addView(this.tabs);

      this.workView = new cdb.ui.common.TabPane({
        el: this.$('.panes')
      });

      this.addView(this.workView);

      // Append menu
      this.menu = new cdb.admin.LayersPanel({
        table: this.table,
        sqlView: this.sqlView,
        map: this.map,
      });

      this.$el.append(this.menu.render().el);
      //this.menu.hide();
      this.addView(this.menu);

      this.tableTab = new cdb.admin.TableTab({
        model: this.table,
        sqlView: this.sqlView,
        geocoder: this.geocoder,
        globalError: this.globalError,
        menu: this.menu
      });

      this.mapTab = new cdb.admin.MapTab({
        model: this.map,
        baseLayers: this.baseLayers,
        table: this.table,
        //infowindow: this.infowindow,
        menu: self.menu
      });
      // the .click must be changed for a better way of reference the action. Ask @jsantana
      this.mapTab.bind('manual', function() { self.$('*[href="#/table"]').click();})
      this.mapTab.bind('georeference', function() { self.$('.georeference').click();})

      this.table.bind('notice', this.globalError.showError, this.globalError);
      this.map.bind('notice', this.globalError.showError, this.globalError);

      this.addView(this.globalError);


      // used to show progress on stuff being done
      var bkg_geocoder = this.bkg_geocoder = new cdb.ui.common.BackgroundImporter({
        template_base: 'table/views/geocoder_progress',
        import_: this.geocoder
      });
      this.$el.append(this.bkg_geocoder.render().el);

      this.geocoder.bind('started', function() {
        // Reset the state each time we start a new geocoder,
        // if not, the state will be 'finished' all the times
        this.state = "";
        self.bkg_geocoder.changeState(self.geocoder);
        self.globalError.showError('Geocoding...', 'load', 0)
      });

      this.geocoder.bind('progress', function() {
        self.bkg_geocoder.render();
      });

      this.geocoder.bind('finished', function() {
        self.geocoder.state = 'finished';
        self.bkg_geocoder.changeState(self.geocoder);
        //self.table.trigger('data:saved');
        self.dataLayer.invalidate();
        self.table.fetch();
        self.globalError.showError('Geocoding complete');
      });

      this.geocoder.bind('templateError', function() {
        self.geocoder.state = 'finished';
        self.bkg_geocoder.changeState(self.geocoder);
        self.globalError.showError("The address template you've entered is incorrect!", "error", 15000)
      });


      this.geocoder.bind('no-data', function() {
        var georeference_alert = new cdb.admin.GeoreferenceNoDataDialog({model: this.model});
        self.$el.append(georeference_alert.render().el);
        georeference_alert.open();
      });

      bkg_geocoder.bind('canceled', function() {
        self.globalError.showError('Geocoding canceled');
        self.geocoder.cancel();
      });

      this.map.bind('change:dataLayer', _.once(function() {

        self.header.setDataLayer(self.dataLayer);

        self.table.bind('change:name', function() {
          self.dataLayer.set({ table_name: self.table.get('name') });
          self.dataLayer.updateCartoCss(self.table.previous('name'), self.table.get('name'));
          self.dataLayer.save();
        });


        //force adding a cache buster from the beginning
        self.dataLayer.updateCacheBuster();

        // init menu
        //self.menu.setDataLayer(self.dataLayer);
        //self.menu.bind('applyQuery', self.applyQuery, self);

        if(self.selectedMenu) {
          //self.menu.show(self.selectedMenu);
        }

      }));

      this.workView.addTab('table', this.tableTab.render());
      this.workView.addTab('map', this.mapTab.render());

      this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);

      this.workView.bind('tabEnabled', this.tabs.activate);
      this.workView.active('table');

      // global click
      enableClickOut(this.$el);

      this.mapTab.bind('missingClick', self.menu.hide, self.menu);
      this.tableTab.tableView.bind('cellClick', self.menu.hide, self.menu);
      this.tableTab.tableView.bind('clearSQLView', this._clearSQLView, this);
      this.tableTab.tableView.bind('applyFilter', function(column, filter) {
        self.dataLayer.set({
          query: self.sqlView.filterColumnSQL(column, self.table.get('name'), filter, self.table.getColumnType(column)),
          read_only: false
        });
      });

      this.mapTab.bind('noGeoRef', this.noGeoRefMapMenu);
      this.mapTab.bind('geoRef', this.geoRefMapMenu);


      // On resize window...
      $(window).bind("resize", this._onResize);


    },

    _clearSQLView: function() {
      this.dataLayer.save({ query: undefined });
      this.dataLayer.addToHistory("query", "SELECT * FROM " + this.table.get('name'));
      //this.menu._writableTableButtons();
    },

    // Close all dialogs in window resize
    _onResize: function(e) {
      cdb.god.trigger("closeDialogs");
    },

    _writableTableButtons: function() {
      //this.menu._writableTableButtons();
    },

    _readOnlyTableButtons: function() {
      //this.menu._readOnlyTableButtons();
    },

    keyUp: function(e) {
    },

    keyPress: function(e) {
    },

    noGeoRefMapMenu: function(e) {
    },

    geoRefMapMenu: function(e) {
      /*if(this.menu.activeSection == 'map' && this.menu) {
        this.menu.showTools('map');
      }*/
    },

    updateQueryInfo: function() {
      var total = this.sqlView.size();

      this.$('.sqlview p')
        .html(
          this.getTemplate('table/views/sql_view_notice_message')({
            empty: total == 0 ? true : false,
          })
        );
    }
  });

    cdb._test = cdb._test || {};
    cdb._test.Table = Table;

    var TableRouter = Backbone.Router.extend({

        initialize: function(table) {
          var self = this;
          this.table = table;
        },

        routes: {
            '': 'index',
            'table': 'index',
            'table/:sql': 'table_sql',
            'map': 'map',
            'map/style': 'mapStyle'
        },

        index: function() {
          this.table.workView.active('table');
          if(this.table.table.isInSQLView()) {
            this.table.menu.showTools('tableLite');
          } else {
            this.table.menu.showTools('table');
          }

        },

        table_sql: function(sql) {
          this.index();
          if(!this.table.table.alterTableData(sql)) {
            this.table.sqlView.setSQL(decodeURIComponent(sql));
            this.table.table.useSQLView(this.table.sqlView);
          }
        },

        map: function() {
          this.table.workView.active('map');
          if(this.table.table.isInSQLView()) {
            this.table.menu.showTools('mapLite');
          } else {
            this.table.menu.showTools('map');
          }
        },

        mapStyle: function() {
          this.map();
          this.table.selectedMenu = 'style_mod';
        }

    });

    cdb.init(function() {
      cdb.config.set(config);
      cdb.templates.namespace = 'cartodb/';

      var table = new Table({
        table_data: table_data,
        user_data: user_data,
        config: config,
        map_data: map_data
      });
      // expose to debug
      window.table = table;
      var router = new TableRouter(window.table);
      Backbone.history.start();
    });

});
