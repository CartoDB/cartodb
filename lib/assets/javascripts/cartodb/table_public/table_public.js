/**
 *  entry point for table
 */


$(function() {


  var TablePublic = cdb.core.View.extend({

    el: document.body,

    initialize: function() {
      this._initModels();
      this._initViews();
      this._initBindings();

    },

    _initModels: function() {
      var self = this;

      this.table = new cdb.open.PublicCartoDBTableMetadata({
        id: this.options.table_id,
        name: this.options.table_name,
        description: this.options.vizjson.description || ''
      });
      this.table.set({
        user_name: this.options.user_name,
        vizjson: this.options.vizjson,
        schema: this.options.schema
      })
      this.columns = this.table.data();
      this.map = new cdb.open.PublicMap();
      this.sqlView = new cdb.admin.SQLViewDataAPI();
      this.sqlView.syncMethod = 'read';
      this.sqlView.options.attributes.skipfields = 'the_geom_webmercator,the_geom';

      var query = this.table.data().getSQL() + " ORDER BY cartodb_id";
      this.table.useSQLView(this.sqlView);
      this.sqlView.setSQL(query);
      this.sqlView.fetch();

      this.user = new cdb.admin.User({ username: this.options.user_name });

      this._initDataLayer();
    },

    _initDataLayer: function() {
      var self = this;

      this.sqlView.bind('reset', function() {
        var sc = _.clone(self.table.get('schema'));
        sc.push(['the_geom', 'geometry']);
        self.table.set('schema', sc, { silent: true });
        self.table.sortSchema();
        // add a new column the_geom with dummy data
        this.sqlView.each(function(row) {
          row.set('the_geom', 'GeoJSON');
        });
      }, this);

      this.sqlView.bind('add', function(row) {
        row.set('the_geom', 'GeoJSON');
      });

    },

    _initViews: function() {
      var self = this;

      // Header
      this.header = new cdb.open.PublicHeader({
        el: this.$('header'),
        model: this.table,
        user: this.user,
        config: this.options.config
      });
      this.addView(this.header);

      // Tabpane
      this.workView = new cdb.ui.common.TabPane({
        el: this.$('.panes')
      });
      this.addView(this.workView);

      // PUBLIC APP TABS
      this.tabs = new cdb.admin.Tabs({
        el: this.$('nav'),
        slash: true
      });
      this.addView(this.tabs);

      // table tab
      this.tableTab = new cdb.open.PublicTableTab({
        model: this.table,
        vizjson: this.options.vizjson,
        user_name: this.options.user_name
      });

      // map tab
      this.mapTab = new cdb.open.PublicMapTab({
        vizjson: this.options.vizjson,
        vizjson_url: this.options.vizjson_url
      });

      this.workView.addTab('table', this.tableTab.render());
      this.workView.addTab('map', this.mapTab.render());
      this.workView.bind('tabEnabled:map', this.mapTab.enableMap, this.mapTab);
      this.workView.bind('tabEnabled', this.tabs.activate);
      this.workView.active('table');
    },

    _initBindings: function() {
      // Global click
      enableClickOut(this.$el);
      // On resize window...
      $(window).bind("resize", this._onResize);
    },

    // Close all dialogs in window resize
    _onResize: function(e) {
      cdb.god.trigger("closeDialogs");
    },

    keyUp: function(e) {},
  });


  cdb.init(function() {
    cdb.config.set(config);
    cdb.templates.namespace = 'cartodb/';

    // Store JS errors
    var errors = new cdb.admin.ErrorStats();
    
    // Main view
    var table = new TablePublic({
      table_id: table_id,
      table_name: table_name,
      user_name: user_name,
      vizjson: vizjson,
      schema: schema,
      config: config
    });
    var table_router = new cdb.open.TableRouter(table);
    // expose to debug
    window.table = table;
    window.table_router = table_router;
    Backbone.history.start({ pushState: true, root: '/tables/' });
  });

});
