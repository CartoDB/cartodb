/**
 *  entry point for table
 */

reset_disqus = function() {
  DISQUS.reset({
    reload: true
  });
};

if (!window.addEventListener) {
  window.attachEvent('orientationchange', reset_disqus, this);
} else {
  window.addEventListener('orientationchange', reset_disqus);
}


  function resizeWindow() {

    var mobileDevice = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    var top          = 0;
    var tableHeight  = $("table").outerHeight(true);
    var windowHeight = $(window).height();

    var heights = $(".navigation").outerHeight(true) - $(".cartodb-info").outerHeight(true) - $(".cartodb-public-header").outerHeight(true);

    top = windowHeight - $(".navigation").outerHeight(true) - $(".cartodb-info").outerHeight(true) - $(".cartodb-public-header").outerHeight(true);

    if (mobileDevice) {
      top = windowHeight - $(".navigation").outerHeight(true) - $(".cartodb-public-header").outerHeight(true) - 80;
    }

    $(".cartodb-map-data").css({ top: top }); 
    $(".separator").css({ top: top + 1}).show(); 
    $(".separator_shadow").css({ top: top + 2 }).show();
    $(".navigation").css({ top: top - 30 }, 250); 
 
    var height = windowHeight - $(".cartodb-info").outerHeight(true) - $(".cartodb-public-header").outerHeight(true);

    if (mobileDevice) {
      height = windowHeight - $(".cartodb-public-header").outerHeight(true);
    }

    if ($("body.public").hasClass("map")) {
      $(".panes").css({ height: height + 69 }); 
    } else {
      $(".panes").css({ height: height }); 
    }

  }

  window.resizeWindow = resizeWindow;

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
        id: this.options.table_name,
        name: this.options.table_name,
        description: this.options.vizjson.description || ''
      });
      this.table.set({
        user_name: this.options.user_name,
        vizjson: this.options.vizjson,
        schema: this.options.schema
      })
      this.columns = this.table.data();
      this.sqlView = new cdb.admin.SQLViewData();
      this.sqlView.syncMethod = 'read';
      this.sqlView.options.attributes.skipfields = 'the_geom_webmercator,the_geom';

      var query = this.table.data().getSQL() + " ORDER BY cartodb_id LIMIT 20";
      this.table.useSQLView(this.sqlView);
      this.sqlView.setSQL(query);
      this.sqlView.fetch();

      this.user = new cdb.admin.User({ username: this.options.user_name });

      this._initDataLayer();
    },

    _initDataLayer: function() {
      var self = this;
    },

    _initViews: function() {
      var self = this;

      // Header
      this.header = new cdb.open.PublicHeader({
        el: this.$('.navigation'),
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
        el: this.$('.navigation ul'),
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

      this.workView.bind('tabEnabled', function(mode) {

        $("body").removeClass("table");
        $("body").removeClass("map");

        $("body").addClass(mode);

        window.resizeWindow();

      }, this.mapTab);

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

    Backbone.history.start({ pushState: Modernizr.history, root: '/tables/' });

  });

  function renderExportOptions() {

    var exportOptions = new cdb.admin.ExportTableOptions({
      model: table.table,
      config: config,
      sql: 'SELECT * FROM ' + table_name,
      force_http: location.protocol.indexOf('https') === -1 ? false : true
    });

    $(".export_options .download_options").append(exportOptions.render().el);

  }

  var onResize = function() {
    resizeWindow();
  };

  var setupMapDimensions;

  var doOnOrientationChange = function() {

    switch(window.orientation)
    {
      case -90:
        case 90: setupMapDimensions(true, true);
      break;
      default: setupMapDimensions(true, true);
      break;
    }

  };

  $.extend( $.easing, {
    easeInQuad: function (x, t, b, c, d) {
      return c*(t/=d)*t + b;
    }
  })

  var mobileDevice = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (!mobileDevice) {
    $(window).on("resize", onResize);
  }

  if (!mobileDevice) renderExportOptions();

  setTimeout(function() {

    resizeWindow();

    var windowHeight = $(window).height();
    var top = windowHeight - $(".cartodb-info").outerHeight(true) - $(".cartodb-public-header").outerHeight(true);

    if (mobileDevice) {
      top = windowHeight - $(".cartodb-public-header").outerHeight(true) - 80;
    }

    $(".navigation").css({ top: windowHeight }); 
    $(".navigation").animate({ top: top - 60, opacity: 1 }, 250); 

  }, 250)

  // recalculate map position on orientation change
  if (!window.addEventListener) {
    window.attachEvent('orientationchange', doOnOrientationChange);
  } else {
    window.addEventListener('orientationchange', _.bind(doOnOrientationChange));
  }

  $("span.help").tipsy({ gravity: $.fn.tipsy.autoBounds(250, 's'), fade: true });

  if ($.browser.msie && parseInt($.browser.version) == 7 ) {
    $(".comments .content").html("<p>Your browser doesn't support comments.</p>")
  }

});
