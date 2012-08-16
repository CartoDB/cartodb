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

        initialize: function() {
          this.user = new cdb.admin.User(this.options.user_data);

          this._initModels();
          this._initViews();

          // init data
          // table change will raise the map and columns fetch
          this.table.fetch();

        },

        /**
         * when there is no layers created the app can create
         * default layers.
         * Two layers are added:
         *  - a base layer with base map (world tiles)
         *  - a data layer which contains the data from the table
         */
        defaultLayers: function() {
          this.map.addLayer(this.baseLayers.at(2).clone());
          this.dataLayer = new cdb.admin.CartoDBLayer({
                  table_name: this.table.get('name'),
                  user_name: this.user.get('username'),
                  tiler_port: cdb.config.get('tiler_port'),
                  tiler_domain: cdb.config.get('tiler_domain'),
                  interactivity: 'cartodb_id'
          });
          this.map.addDataLayer(this.dataLayer);
          this.map.layers.at(0).save();
          this.dataLayer.save();
        },

        _initModels: function() {
          var self = this;
          this.table = new cdb.admin.CartoDBTableMetadata({
            id: this.options.table_id
          });
          this.columns = this.table.data();
          this.map = new cdb.admin.Map();
          this.infowindow = new cdb.geo.ui.InfowindowModel({ });
          this.sqlView = new cdb.admin.SQLViewData();


          //TODO: load this from an initial data file or d
          // something like this

          var layers = [
            'http://tile.stamen.com/toner/{z}/{x}/{y}.png',
            'http://a.tiles.mapbox.com/v3/mapbox.mapbox-light/{z}/{x}/{y}.png',
            //'http://tile.stamen.com/terrain/{z}/{x}/{y}.png',
            //'http://tile.stamen.com/watercolor/{z}/{x}/{y}.png',
            'http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png'
          ];

          this.baseLayers = new cdb.geo.Layers(
            _(layers).map(function(m) {
              return new cdb.geo.TileLayer({ urlTemplate: m });
            })
          );

          // fetch or create map id
          this.map.relatedTo(this.table);
          this.map.layers.bind('reset', function() {
            if(self.map.layers.size() === 0) {
              self.defaultLayers();
            }
          });

          //temporal
          this.table.bind('change:schema', function() {
            _(self.table.get('schema')).each(function(v) {
              self.infowindow.addField(v[0]);
            });
            self.table.unbind(null, null, this);
          }, this.infowindow);

          this.map.bind('change:dataLayer', _.once(function() {
            self.table.bind('change:dataSource', function() {
              if(this.isInSQLView()) {
                self.dataLayer.set({
                  query: this.data().getSQL()
                });
              }
            });
          }));

        },

        _initViews: function() {
          var self = this;

          this.header = new cdb.admin.Header({
            el: this.$('header'),
            model: this.table,
            user: this.user
          });

          this.tabs = new cdb.admin.Tabs({
            el: this.$('nav')
          });

          this.workView = new cdb.ui.common.TabPane({
            el: this.$('.panes')
          });

          this.tableTab = new cdb.admin.TableTab({
            model: this.table
          });

          this.mapTab = new cdb.admin.MapTab({
            model: this.map,
            baseLayers: this.baseLayers,
            table: this.table,
            infowindow: this.infowindow
          });

          this.globalError = new cdb.admin.GlobalError({
            el: $('.globalerror')
          });
          this.table.bind('notice', this.globalError.showError, this.globalError);

          this.menu = new cdb.admin.RightMenu({});
          this.$el.append(this.menu.render().el);
          this.menu.hide();

          this.map.bind('change:dataLayer', _.once(function() {

            self.dataLayer = self.map.get('dataLayer');

            self.table.bind('change:name', function() {
              self.dataLayer.set({ table_name: self.table.get('name') });
              self.dataLayer.save();
            });
            // set api key when we have api key and the data layer loaded
            var sql = self.table.isInSQLView() ?
                          self.table.data().getSQL() :
                          undefined;

            self.dataLayer.set({
              sql: sql,
              extra_params: {
                map_key: self.user.get('api_key')
              }
            });

            // lateral menu modules
            var sql = new cdb.admin.mod.SQL({
              model: this.table,
              sqlView: self.sqlView
            });

            var carto = new cdb.admin.mod.Carto({
              model: self.dataLayer,
              table: self.table
            });

            var infowindow = new cdb.admin.mod.InfoWindow({
              table: self.table,
              model: self.infowindow
            });
            self.menu.addModule(sql.render(), ['table', 'map']);
            self.menu.addModule(carto.render(), 'map');
            self.menu.addModule(infowindow.render(), 'map');

          }));

          this.workView.addTab('table', this.tableTab.render());
          this.workView.addTab('map', this.mapTab.render());
          this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);

          this.workView.bind('tabEnabled', this.tabs.activate);
          this.workView.active('table');

          // global click
          enableClickOut(this.$el);

        },

        keyUp: function(e) {
        },

        keyPress: function(e) {
          if(e.which == 19) {
            this.menu.show();
            this.menu.active('sql_mod');
            e.preventDefault();
            return false;
          }
        }

    });

    cdb._test = cdb._test || {};
    cdb._test.Table = Table;

    var TableRouter = Backbone.Router.extend({

        initialize: function(table) {
          var self = this;
          this.table = table;
          this.table.table.bind('change:dataSource', function() {
            if(this.isInSQLView()) {
              var sql = this.data().getSQL();
              self.navigate('table/' + encodeURIComponent(sql));
            } else {
              self.navigate('table');
            }
          });
        },

        routes: {
            '': 'index',
            'table': 'index',
            'table/:sql': 'table_sql',
            'map': 'map'
        },

        index: function() {
          this.table.workView.active('table');
          this.table.menu.showTools('table');
        },

        table_sql: function(sql) {
          this.index();
          this.table.sqlView.setSQL(decodeURIComponent(sql));
          this.table.table.useSQLView(this.table.sqlView);
        },

        map: function() {
          this.table.workView.active('map');
          this.table.menu.showTools('map');
        }

    });



    cdb.init(function() {
      cdb.config.set({
        tiler_port: '8181',
        tiler_domain: 'localhost.lan'
      });
      cdb.templates.namespace = 'cartodb/';
      var table = new Table({
        table_id: table_id,
        user_data: user_data
      });
      var router = new TableRouter(table);
      // expose to debug
      window.table = table;
      Backbone.history.start();
    });

});
