/**
 *  entry point for table
 */


$(function() {


  var TablePublic = cdb.core.View.extend({

    el: document.body,

    initialize: function() {
      this._initModels();
      this._initViews();
      // init data
      var sql = 'select * from ' + this.table.get('name');
      this.sqlView.setSQL(sql);
      this.table.useSQLView(this.sqlView);
    },

    _initModels: function() {
      var self = this;

      if(cdb.config.get('debug')) {
        var layer = vizjson.layers[1];
        layer.options.no_cdn = true;
      }

      this.table = new cdb.open.PublicCartoDBTableMetadata({
        id: this.options.table_id,
        name: this.options.table_name
      });
      this.table.set({
        user_name: this.options.user_name,
        vizjson: this.options.vizjson,
        schema: this.options.schema
      })
      this.columns = this.table.data();
      this.map = new cdb.open.PublicMap()
      this.sqlView = new cdb.admin.SQLViewDataAPI();
      
      this._initDataLayer();
    },

    _initDataLayer: function() {

      this.table.bind('change:dataSource', function() {
        var sql = 'select * from ' + this.get('name');
        if(this.isInSQLView()) {
          sql = this.data().getSQL();
        }
        //TODO: set sql to datalayer

      });

      var sql = 'select * from ' + this.table.get('name');
      var query = this.options.vizjson.layers[1].options.query;
      query = query || sql;
      if(query) {
        this.sqlView.setSQL(query);
        this.table.useSQLView(self.sqlView);
      }
    },

    _initViews: function() {
      var self = this;

      this.header = new cdb.open.PublicHeader({
        el: this.$('header'),
        model: this.table,
        user: this.user,
        config: this.options.config,
        geocoder: this.geocoder,
        vizjson: this.options.vizjson,
        user_name: this.options.user_name
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
      this.tableTab = new cdb.open.PublicTableTab({
        model: this.table,
        vizjson: this.options.vizjson,
        user_name: this.options.user_name
      });

      this.mapTab = new cdb.open.PublicMapTab({
        vizjson: this.options.vizjson
      });

      this.globalError = new cdb.admin.GlobalError({
        el: $('.globalerror')
      });
      this.table.bind('notice', this.globalError.showError, this.globalError);
      this.addView(this.globalError);

      this.workView.addTab('table', this.tableTab.render());
      this.workView.addTab('map', this.mapTab.render());
      this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);

      this.workView.bind('tabEnabled', this.tabs.activate);
      this.workView.active('table');

      // global click
      enableClickOut(this.$el);

      // On resize window...
      $(window).bind("resize", this._onResize);

    },

    // Close all dialogs in window resize
    _onResize: function(e) {
      cdb.god.trigger("closeDialogs");
    },

    keyUp: function(e) {
    },

  });

    var TableRouter = Backbone.Router.extend({

        initialize: function(table) {
          var self = this;
          this.table = table;
        },

        routes: {
            '': 'index',
            'table': 'index',
            'table/:sql': 'table_sql',
            'map': 'map'
        },

        index: function() {
          this.table.workView.active('table');
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
        }

    });

    cdb.init(function() {

      cdb.config.set(config);
      cdb.templates.namespace = 'cartodb/';
      var table = new TablePublic({
        table_id: table_id,
        table_name: table_name,
        user_name: user_name,
        vizjson: vizjson,
        schema: schema,
        config: config,
      });
      var router = new TableRouter(table);
      // expose to debug
      window.table = table;
      Backbone.history.start();
    });

});

