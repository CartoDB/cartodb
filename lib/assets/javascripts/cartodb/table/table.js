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
      this.table = null;
      this.selectedMenu = null; // enable this
      this.workViewActive = 'table';
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
      //this.table.trigger('change', this.table);

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
      this.vis = new cdb.admin.Visualization(this.options.vis_data);
      this.vis.map.set(this.vis.map.parse(this.options.map_data));
      this.map = this.vis.map;

      var layers = cdb.admin.DEFAULT_LAYERS;
      this.baseLayers = this.user.layers;

      _(layers).map(function(m) {

        self.baseLayers.add(new cdb.admin.TileLayer({
          name:        m.name,
          className:   "default " + m.className,
          base_type:   m.className,
          urlTemplate: m.url,
          read_only:   true,
          maxZoom:     m.maxZoom,
          attribution: m.attribution
        }));

      });

    },

    _initViews: function() {
      var self = this;

      this.globalError = new cdb.admin.GlobalError({
        el: $('.globalerror')
      });
      this.globalError.listenGlobal();
      this.addView(this.globalError);

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
        vis: this.vis,
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
        this.tableTab.setTable(this.table, this.sqlView);
        this.mapTab.setActiveLayer(layerView.model);
      }, this)


      /*
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
      */

      // global click
      enableClickOut(this.$el);

      // On resize window...
      $(window).bind("resize", this._onResize);
    },

    _initTableMap: function() {
      var self = this;
      
      // Init geocoder
      this.geocoder = new cdb.admin.Geocoding('', this.table);

      // New visualization header
      this.header = new cdb.admin.Header({
        el: this.$('header'),
        globalError: this.globalError,
        model: this.vis,
        user: this.user,
        config: this.options.config,
        geocoder: this.geocoder
      });
      this.addView(this.header);

      // Table tab
      this.tableTab = new cdb.admin.TableTab({
        model: this.table,
        sqlView: this.sqlView,
        geocoder: this.geocoder,
        globalError: this.globalError,
        menu: this.menu
      });

      // Map tab
      this.mapTab = new cdb.admin.MapTab({
        model: this.map,
        baseLayers: this.baseLayers,
        table: this.table,
        user_data: this.options.user_data,
        //infowindow: this.infowindow,
        menu: this.menu
      });
      // the .click must be changed for a better way of reference the action. Ask @jsantana
      this.mapTab.bind('manual', function() { self.$('*[href="#/table"]').click();})
      this.mapTab.bind('georeference', function() { self.$('.georeference').click();})

      this.map.bind('notice', this.globalError.showError, this.globalError);



      this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);

      this.workView.bind('tabEnabled', this.tabs.activate);

      this.mapTab.bind('missingClick', self.menu.hide, self.menu);
      this.workView.bind('tabEnabled:table', function() {
        /*
        this.tableTab.tableView.bind('cellClick', self.menu.hide, self.menu);
        this.tableTab.tableView.bind('clearSQLView', this._clearSQLView, this);
        this.tableTab.tableView.bind('applyFilter', function(column, filter) {
          self.dataLayer.set({
            query: self.sqlView.filterColumnSQL(column, self.table.get('name'), filter, self.table.getColumnType(column)),
            read_only: false
          });
        });
        */
      }, this);

      this.mapTab.bind('noGeoRef', this.noGeoRefMapMenu);
      this.mapTab.bind('geoRef', this.geoRefMapMenu);

      this.workView.addTab('table', this.tableTab.render(), { active: false });
      this.workView.addTab('map', this.mapTab.render(), { active: false });
      this.workView.active(this.workViewActive);
    },

    setTable: function(table, sqlView) {
      if(this.table) {
        this.table.unbind('notice', null, this.globalError);
      }
      this.table = table;
      this.sqlView = sqlView;
      this.table.bind('notice', this.globalError.showError, this.globalError);
    },


    // Close all dialogs in window resize
    _onResize: function(e) {
      cdb.god.trigger("closeDialogs");
    },

    keyUp: function(e) { },

    keyPress: function(e) { },

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

  var TableRouter = Backbone.Router.extend({

      initialize: function(table) {
        var self = this;
        this.table = table;
      },

      routes: {
          '': 'index',
          'table': 'index',
          //'table/:sql': 'table_sql',
          'map': 'map',
      },

      index: function() {
        this.table.activeView('table');
      },

      map: function() {
        this.table.activeView('map');
      }

      /*table_sql: function(sql) {
        this.index();
        if(!this.table.table.alterTableData(sql)) {
          this.table.sqlView.setSQL(decodeURIComponent(sql));
          this.table.table.useSQLView(this.table.sqlView);
        }
      }*/


  });

  cdb.init(function() {
    cdb.config.set(config);
    cdb.templates.namespace = 'cartodb/';

    var table = new Table({
      vis_data: vis_data,
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
