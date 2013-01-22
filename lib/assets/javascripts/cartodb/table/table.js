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

      /*this.table.bind('change:name', function(ev) {
        document.title = this.get("name") + ' | CartoDB';
      });

      */
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


    _initModels: function() {
      var self = this;
      this.vis = new cdb.admin.Visualization();
      this.vis.map.set(this.vis.map.parse(this.options.map_data));
      this.map = this.vis.map;
      this.sqlView = new cdb.admin.SQLViewData();

      this.table = new cdb.admin.CartoDBTableMetadata(
        this.options.table_data
      );

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

      // on success and no modify rows save the query!
      /*self.sqlView.bind('reset', function() {
        if(self.sqlView.modify_rows) {
          self.table.useSQLView(null);
        } else {
          self._readOnlyTableButtons();
        }
        self.updateQueryInfo();
      });*/

    },

    _initViews: function() {
      var self = this;

      this.globalError = new cdb.admin.GlobalError({
        el: $('.globalerror')
      });
      this.globalError.listenGlobal();

      // ***  header
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
      this.menu = new cdb.admin.LayersPanel({
        table: this.table,
        sqlView: this.sqlView,
        map: this.map,
        user: this.user,
        globalError: this.globalError
      });

      this.$el.append(this.menu.render().el);
      this.menu.hide();
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
      bkg_geocoder.bindGeocoder();

      this.geocoder.bind('no-data', function() {
        var georeference_alert = new cdb.admin.GeoreferenceNoDataDialog({model: this.model});
        self.$el.append(georeference_alert.render().el);
        georeference_alert.open();
      });

      bkg_geocoder.bind('canceled', function() {
        self.globalError.showError('Geocoding canceled');
      });

      this.geocoder.bind('finished', function() {
        self.table.fetch();
        self.globalError.showError('Geocoding complete');
      }, this);

      this.geocoder.bind('templateError', function() {
        self.globalError.showError("The address template you've entered is incorrect!", "error", 15000)
      }, this);

      this.workView.addTab('table', this.tableTab.render());
      this.workView.addTab('map', this.mapTab.render());

      this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);

      this.workView.bind('tabEnabled', this.tabs.activate);
      this.workView.active('table');

      // global click
      enableClickOut(this.$el);

      this.mapTab.bind('missingClick', self.menu.hide, self.menu);
      this.tableTab.tableView.bind('cellClick', self.menu.hide, self.menu);
      //this.tableTab.tableView.bind('clearSQLView', this._clearSQLView, this);
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


    // Close all dialogs in window resize
    _onResize: function(e) {
      cdb.god.trigger("closeDialogs");
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
