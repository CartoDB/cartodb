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
      })

      // trigger a manual change to all the widgets get updated
      this.table.trigger('change', this.table);

      this.keyBind();
    },
    /**
    * Bind the keystrokes associated with menu actions
    * alt + <- : show right menu
    * alt + -> : hide right menu
    * alt + c : toggle carto
    * alt + s : toggle sql
    * @method keyBind
    * TODO: extract to a better place to allow use in all the views
    */
    keyBind: function() {
      var self = this;
      $('body').bind('keydown', function(e) {
        if(e.altKey && e.ctrlKey) {
          if(e.keyCode == 68) { // d
            e.preventDefault();
            e.stopPropagation();
            self.menu.isOpen?
              self.menu.hide():
              self.menu.show();
            return false;
          }

          if(e.keyCode == 67) { // c key
            e.preventDefault();
            e.stopPropagation();
            self.menu.getButtonByClass('carto_mod').click(e);
            return false;
          }
          if(e.keyCode == 83) { // s key
            e.preventDefault();
            e.stopPropagation();
            self.menu.getButtonByClass('sql_mod').click(e);
            return false;
          }
        }
      });
    },

    appyQuery: function(sql) {
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
      this.infowindow = new cdb.geo.ui.InfowindowModel({
        template_name: 'table/views/infowindow_light'
      });
      this.sqlView = new cdb.admin.SQLViewData();
      this.geocoder = new cdb.admin.Geocoding('', this.table);

      //TODO: load this from an initial data file or d
      var layers = [
        {
          url: 'http://tile.stamen.com/toner/{z}/{x}/{y}.png',
          maxZoom: 17,
          name: 'Toner',
          className: "mapbox_toner"
        },
        {
          url: 'http://a.tiles.mapbox.com/v3/mapbox.mapbox-light/{z}/{x}/{y}.png',
          maxZoom: 17,
          name: 'Light',
          className: "mapbox_light"
        },
        {
          url: 'http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png',
          maxZoom: 17,
          name: 'Streets',
          className: "mapbox_streets"
        }

      ];

      this.baseLayers = this.user.layers;
      _(layers).map(function(m) {

        self.baseLayers.add(new cdb.admin.TileLayer({
          name:        m.name,
          className:   m.className,
          urlTemplate: m.url,
          read_only:   true,
          maxZoom:     m.maxZoom
        }));

      });



      // fetch or create map id
      // this.map.relatedTo(this.table);

      this.map.bind('change:dataLayer', _.once(function() {

        // cache the value to access it in all the view
        self.dataLayer = self.map.get('dataLayer');
        // when the layer query changes the table should change
        self.dataLayer.bind('change:query', function() {
          var sql = this.get('query');
          if(sql) {
            self.appyQuery(sql);
          } else {
            self.table.useSQLView(null);
          }
        });

        // on error rollback the query in the model
        self.sqlView.bind('error', function() {
          self.sqlView.reset([]);
          self.dataLayer.save({query: null}, {silent: true});
        });

        // on success and no modify rows save the query!
        self.sqlView.bind('reset', function() {
          if(self.sqlView.modify_rows) {
            self.dataLayer.set({query: null});
            self.table.useSQLView(null);
          } else {
            self.dataLayer.save(null, {silent: true});
          }
        });

        // trigger the event to ping all views
        self.dataLayer.trigger('change:query');

        var infowindowData = self.dataLayer.get('infowindow');
        if(infowindowData) {
          self.infowindow.set(infowindowData);
        } else {
          // assign a position from start
          var pos = 0;
          _(self.table.get('schema')).each(function(v) {
            if(!_.contains(['the_geom', 'created_at', 'updated_at'], v[0])) {
              self.infowindow.addField(v[0], pos);
              ++pos;
            }
          });
        }

        self.dataLayer.bind('tileError', function() {
          self.globalError.showError('there is some problem with the tiles, check the style', 'error', 0);
          // self.menu.show('carto_mod');

        }, self.globalError)

        self.dataLayer.bind('tileOk', function() {
          self.globalError.hide();
        }, this);


        // check all the fields in the infowindows are in table schema
        // remove the missing ones
        self.table.bind('change:schema', function() {
          var columns = self.table.columnNames();
          columns = _(columns).filter(function(c) {
            return !_.contains(['the_geom', 'created_at', 'updated_at'], c);
          });

          _(self.infowindow.get('fields')).each(function(c) {
            if(!_.contains(columns, c.name)) {
              self.infowindow.removeField(c.name);
            }
          });

        });

        self.infowindow.bind('change:fields change:template_name', _.debounce(function() {
          // call with silent so the layer is no realoded
          // if some view needs to be changed when infowindow is changed it should be
          // subscribed to infowindow model not to dataLayer
          // (which is only a data container for infowindow)
          self.dataLayer.save({ infowindow: self.infowindow.toJSON() }, { silent: true });
        }, 200));


      }));

    },

    _initViews: function() {
      var self = this;

      this.header = new cdb.admin.Header({
        el: this.$('header'),
        model: this.table,
        user: this.user,
        config: this.options.config,
        user_data: this.options.user_data,
        geocoder: this.geocoder
      });
      this.addView(this.header);


      this.tabs = new cdb.admin.Tabs({
        el: this.$('nav'),
        slash: true
      });
      this.addView(this.tabs);

      this.workView = new cdb.ui.common.TabPane({
        el: this.$('.panes')
      });

      this.addView(this.workView);

      this.tableTab = new cdb.admin.TableTab({
        model: this.table,
        sqlView: this.sqlView,
        geocoder: this.geocoder
      });

      this.mapTab = new cdb.admin.MapTab({
        model: this.map,
        baseLayers: this.baseLayers,
        table: this.table,
        infowindow: this.infowindow
      });
      // the .click must be changed for a better way of reference the action. Ask @jsantana
      this.mapTab.bind('manual', function() { self.$('*[href="#/table"]').click();})
      this.mapTab.bind('georeference', function() { self.$('.georeference').click();})


      this.globalError = new cdb.admin.GlobalError({
        el: $('.globalerror')
      });
      this.globalError.listenGlobal();

      this.table.bind('notice', this.globalError.showError, this.globalError);
      this.map.bind('notice', this.globalError.showError, this.globalError);

      this.addView(this.globalError);


      // used to show progress on stuff being done
      var bkg_geocoder = this.bkg_geocoder = new cdb.ui.common.BackgroundImporter({
        template_base: 'table/views/geocoder_progress',
        import_: this.geocoder
      });
      this.$el.append(this.bkg_geocoder.render().el);

      this.geocoder.bind('start', function() {
        self.bkg_geocoder.changeState(self.geocoder);
      });

      this.geocoder.bind('progress', function() {
        self.bkg_geocoder.render();
      });

      this.geocoder.bind('finished', function() {
        self.bkg_geocoder.changeState(self.geocoder);
      });

      this.geocoder.bind('no-data', function() {
        var georeference_alert = new cdb.admin.GeoreferenceNoDataDialog({model: this.model});
        self.$el.append(georeference_alert.render().el);
        georeference_alert.open();
      });

      bkg_geocoder.bind('canceled', function() {
        self.geocoder.cancel();
      });



      this.menu = new cdb.admin.RightMenu({});
      this.$el.append(this.menu.render().el);
      this.menu.hide();
      this.addView(this.menu);

      this.map.bind('change:dataLayer', _.once(function() {

        self.header.setDataLayer(self.dataLayer);

        self.table.bind('change:name', function() {
          self.dataLayer.set({ table_name: self.table.get('name') });
          self.dataLayer.save();
        });

        self.dataLayer.set({
          table_name: self.table.get('name'),
          user_name: self.user.get("username"),
          sql: sql,
          extra_params: {
            map_key: self.user.get('api_key')
          },
          sql_api_domain: cdb.config.get('sql_api_domain'),
          sql_api_endpoint: cdb.config.get('sql_api_endpoint'),
          sql_api_port: cdb.config.get('sql_api_port'),
          tiler_domain: cdb.config.get('tiler_domain'),
          tiler_port: cdb.config.get('tiler_port'),
          no_cdn: true
        });

        // set api key when we have api key and the data layer loaded
        var sql = self.table.isInSQLView() ?
                      self.table.data().getSQL() :
                      undefined;


        // lateral menu modules
        var sql = new cdb.admin.mod.SQL({
          model: self.dataLayer,
          sqlView: self.sqlView,
          table: self.table
        });

        sql
          .bind('writeSQL', self.appyQuery, self)
          .bind('clearSQLView', function() {
            self.dataLayer.save({ query: undefined });
          });

        var carto = new cdb.admin.mod.Carto({
          model: self.dataLayer,
          table: self.table
        }).bind('enable', function(type) {
          self.menu.changeWithin(type);
        }).bind('hasErrors', function() {
          self.menu.addClassToButton('carto_mod', 'has_errors')
        }).bind('clearError', function() {
          self.menu.removeClassFromButton('carto_mod', 'has_errors');
        });


        var infowindow = new cdb.admin.mod.InfoWindow({
          table: self.table,
          model: self.infowindow
        });
        self.menu.addModule(sql.render(), ['table', 'map', 'mapLite']);
        self.menu.addModule(carto.render(), 'map');
        self.menu.addModule(infowindow.render(), 'map');

        var addRow = self.menu.addToolButton('add_row', 'table');
        var addColumn = self.menu.addToolButton('add_column', 'table');
        addColumn.bind('click', function() {
            new cdb.admin.NewColumnDialog({
              table: self.table
            }).appendToBody().open();
        });
        addRow.bind('click', function() {
          self.table.data().addRow({ at: 0});
          self.trigger('createRow');
        });

        if(self.selectedMenu) {
          //self.menu.active(self.selectedMenu);
          self.menu.show(self.selectedMenu);
        }

      }));

      this.workView.addTab('table', this.tableTab.render());
      this.workView.addTab('map', this.mapTab.render());

      this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);

      this.workView.bind('tabEnabled', this.tabs.activate);
      this.workView.active('table');

      // global click
      enableClickOut(this.$el);

      this.mapTab.bind('missingClick', function() {
        self.menu.hide();
      });
      this.tableTab.tableView.bind('cellClick', function() {
        self.menu.hide();
      });

      this.tableTab.tableView.bind('clearSQLView', function() {
        self.dataLayer.save({ query: undefined });
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

    keyUp: function(e) {
    },

    keyPress: function(e) {
      /*if(e.which == 19) {
        this.menu.show();
        this.menu.active('sql_mod');
        e.preventDefault();
        return false;
      }*/
    },

    noGeoRefMapMenu: function(e) {
      this.menu.hideMapTools();
    },

    geoRefMapMenu: function(e) {
      this.menu.showMapTools();
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
          this.table.menu.showTools('table');
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
          if(!this.table.menu.hiddenMapTools) {
            this.table.menu.showTools('map');
          } else {
            this.table.menu.showTools('mapLite');
          }
        },

        mapStyle: function() {
          this.map();
          this.table.selectedMenu = 'carto_mod';
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
