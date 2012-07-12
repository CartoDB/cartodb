/**
 *  entry point for table
 */


$(function() {

    var Table = cdb.core.View.extend({
        el: document.body,

        initialize: function() {

          this._initModels();
          this._initViews();

          // init data
          this.table.fetch();
          this.columns.fetch();
          var URL = 'http://a.tiles.mapbox.com/v3/mapbox.mapbox-streets/{z}/{x}/{y}.png';
          this.map.addLayer(new cdb.geo.TileLayer({
            urlTemplate: URL
          }));
          this.map.setZoom(4);
          this.map.setCenter([34.30714385628804, 11.6015625]);
        },

        _initModels: function() {
          this.table = new cdb.admin.CartoDBTableMetadata({
            id: table_id
          });
          this.columns = this.table.data();
          this.map = new cdb.geo.Map();
        },

        _initViews: function() {

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
            model: this.map
          });

          this.menu = new cdb.admin.RightMenu({});
          this.$el.append(this.menu.render().el);

          // lateral menu modules
          var sql = new cdb.admin.mod.SQL({ model: this.table });
          this.menu.addModule(sql.render());
          //sql.bind('sqlQuery', this.table.sql);


          this.workView.addTab('table', this.tableTab.render());
          this.workView.addTab('map', this.mapTab.render());
          this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);

          this.workView.bind('tabEnabled', this.tabs.activate);
          this.workView.active('table');

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
      var table = new Table();
      var router = new TableRouter(table);
      // expose to debug
      window.table = table;
      Backbone.history.start();
    });

});
