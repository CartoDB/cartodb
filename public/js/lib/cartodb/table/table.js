/**
 *  entry point for table
 */


$(function() {


    var Table = cdb.core.View.extend({
        el: document.body,
        events: {
          'keypress': 'keyPress'
        },

        initialize: function() {

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
          this.map = new cdb.geo.Map();

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
            tiler_domain: cdb.config.get('tiler_domain')
          });

          // when the table name is known the tiles from
          // the tile server can be fetched
          this.table.bind('change:name', function() {
            self.dataLayer.set({ table_name: self.table.get('name') });
            self.map.addLayer(self.dataLayer);
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
            baseLayers: this.baseLayers
          });

          this.menu = new cdb.admin.RightMenu({});
          this.$el.append(this.menu.render().el);
          this.menu.hide();

          // lateral menu modules
          var sql = new cdb.admin.mod.SQL({ model: this.table });
          this.menu.addModule(sql.render());

          //sql.bind('sqlQuery', this.table.sql);


          this.workView.addTab('table', this.tableTab.render());
          this.workView.addTab('map', this.mapTab.render());
          this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);

          this.workView.bind('tabEnabled', this.tabs.activate);
          this.workView.active('table');

        },

        keyPress: function(e) {
          if(String.fromCharCode(e.keyCode) === 's') {
            this.menu.show();
            this.menu.active('sql');
            e.preventDefault();
          }
          return 0;
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
        },

        map: function() {
          this.table.workView.active('map');
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
