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
          this.map.setCenter([34.30714385628804, 11.6015625]);
          this.map.setZoom(2);
          this.map.addLayer(new cdb.geo.TileLayer({
            urlTemplate: URL
          }));
        },

        _initModels: function() {
          this.table = new cdb.admin.CartoDBTableMetadata({
            name: table_name
          });
          this.columns = this.table.data();
          this.map = new cdb.geo.Map();
        },

        _initViews: function() {

          this.workView = new cdb.ui.common.TabPane({
            el: this.$('.panes')
          });

          this.tableTab = new cdb.admin.TableTab({
            model: this.table
          });

          this.mapTab = new cdb.admin.MapTab({
            model: this.map
          });


          this.workView.addTab('table', this.tableTab.render());
          this.workView.addTab('map', this.mapTab.render());
          this.mapTab.enableMap();

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
