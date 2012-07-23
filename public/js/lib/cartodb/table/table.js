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

          this.ctrlPressed = false;

          this._initModels();
          this._initViews();

          // init data
          this.table.fetch();
          this.columns.fetch();
          // add base layer
          this.map.addLayer(this.baseLayers.at(4).clone());
          // add cartodb layer
          this.map.setZoom(4);
          this.map.setCenter([34.30714385628804, 11.6015625]);
        },

        _initModels: function() {
          var self = this;
          this.table = new cdb.admin.CartoDBTableMetadata({
            id: table_id
          });
          this.columns = this.table.data();
          this.map = new cdb.admin.Map();
          this.infowindow = new cdb.geo.ui.InfowindowModel({ });

          //TODO: load this from an initial data file or d
          // something like this

          var layers = [
            'http://tile.stamen.com/toner/{z}/{x}/{y}.png',
            'http://a.tiles.mapbox.com/v3/mapbox.mapbox-light/{z}/{x}/{y}.png',
            'http://tile.stamen.com/terrain/{z}/{x}/{y}.png',
            'http://tile.stamen.com/watercolor/{z}/{x}/{y}.png',
            'http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png'
          ];

          this.baseLayers = new cdb.geo.Layers(
            _(layers).map(function(m) {
              return new cdb.geo.TileLayer({ urlTemplate: m });
            })
          );

          this.dataLayer = new cdb.geo.CartoDBLayer({
            user_name: user_name,
            tiler_port: cdb.config.get('tiler_port'),
            tiler_domain: cdb.config.get('tiler_domain'),
            interactivity: 'cartodb_id'
          });

          // when the table name is known the tiles from
          // the tile server can be fetched
          this.table.bind('change:name', function() {
            self.dataLayer.set({table_name: this.get('name')});
            self.map.addLayer(self.dataLayer);
          });

          // fetch or create map id
          this.map.relatedTo(this.table);

          //temporal
          this.table.bind('change:schema', function() {
            _(self.table.get('schema')).each(function(v) {
              self.infowindow.addField(v[0]);
            });
            self.table.unbind(null, null, this);
          }, this.infowindow);

          this.table.bind('change:dataSource', function() {
            var sql = '';
            if(this.isInSQLView()) {
              sql = this.data().options.get('sql');
            }
            cdb.log.info("tiler: sql: " + sql);
            self.dataLayer.set({
              query: sql
            });
          });
        },

        _initViews: function() {

          this.header = new cdb.admin.Header({
            el: this.$('header'),
            model: this.table
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
            dataLayer: this.dataLayer,
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

          // lateral menu modules
          var sql = new cdb.admin.mod.SQL({ model: this.table });
          var carto = new cdb.admin.mod.Carto({ model: this.dataLayer });
          var infowindow = new cdb.admin.mod.InfoWindow({ 
            table: this.table,
            model: this.infowindow
          });
          this.menu.addModule(sql.render(), ['table', 'map']);
          this.menu.addModule(carto.render(), 'map');
          this.menu.addModule(infowindow.render(), 'map');

          //sql.bind('sqlQuery', this.table.sql);


          this.workView.addTab('table', this.tableTab.render());
          this.workView.addTab('map', this.mapTab.render());
          this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);

          this.workView.bind('tabEnabled', this.tabs.activate);
          this.workView.active('table');

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

    var TableRouter = Backbone.Router.extend({

        initialize: function(table) {
          this.table = table;
        },

        routes: {
            '': 'index',
            'table': 'index',
            'map': 'map'
        },

        index: function() {
          this.table.workView.active('table');
          this.table.menu.showTools('table');
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
      var table = new Table();
      var router = new TableRouter(table);
      // expose to debug
      window.table = table;
      Backbone.history.start();
    });

});
