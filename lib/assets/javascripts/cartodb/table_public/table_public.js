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

$.extend( $.easing, {
  easeInQuad: function (x, t, b, c, d) {
    return c*(t/=d)*t + b;
  }
})

  function resizeWindow(animated) {

    var mobileDevice = /Android|webOS|iPad|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    var top          = 0;
    var tableHeight  = $("table").outerHeight(true);
    var windowHeight = $(window).height();

    var heights = $(".navigation").outerHeight(true) - $(".cartodb-info").outerHeight(true) - $(".cartodb-public-header").outerHeight(true);

    top = windowHeight - $(".navigation").outerHeight(true) - $(".cartodb-info").outerHeight(true) - $(".cartodb-public-header").outerHeight(true);

    if (mobileDevice) {

      var h = 120;

      if (windowHeight < 670) {
        h = 80;
      } 

      top = windowHeight - $(".navigation").outerHeight(true) - $(".cartodb-public-header").outerHeight(true) - h;
    }

    if (animated) {

      $(".cartodb-map-data").animate({ top: top }, { easing: "easeInQuad", duration: 150 }); 
      $(".separator").animate({ top: top + 1}, { easing: "easeInQuad", duration: 150 }).show(); 
      $(".separator_shadow").animate({ top: top + 2 }, { easing: "easeInQuad", duration: 150 }).show();
      $(".navigation").animate({ top: top - 30 }, { easing: "easeInQuad", duration: 150 }); 

    } else {

      $(".cartodb-map-data").css({ top: top }); 
      $(".separator").css({ top: top + 1}).show(); 
      $(".separator_shadow").css({ top: top + 2 }).show();
      $(".navigation").css({ top: top - 30 }, 250); 

    }
 
    var height = windowHeight - $(".cartodb-info").outerHeight(true) - $(".cartodb-public-header").outerHeight(true);

    if (mobileDevice) {
      height = windowHeight - $(".cartodb-public-header").outerHeight(true);
    }

    if ($("body.public").hasClass("map")) {

      if (animated) $(".panes").animate({ height: height + 69 }, { easing: "easeInQuad", duration: 150 }); 
      else $(".panes").css({ height: height + 69 }); 

    } else {

      if (animated) $(".panes").css({ height: height }, { easing: "easeInQuad", duration: 150 }); 
      else $(".panes").css({ height: height }); 

    }

  }

  window.resizeWindow = resizeWindow;

$(function() {

  var TablePublic = cdb.core.View.extend({

    _TEXTS: {
      copy_table_dialog: {
        title:   _t('Name for your copy of this table'),
      }
    },

    el: document.body,

    events: {
      'click .fork': '_copyTableToYourAccount'
    },

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
      this.sqlView.options.attributes.skipfields = 'the_geom_webmercator';

      var query = this.table.data().getSQL()
      this.table.useSQLView(this.sqlView);
      this.sqlView.setSQL(query);
      this.sqlView.options.set('rows_per_page', 20, { silent: true });
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
        auth_token: this.options.auth_token,
        https: this.options.https,
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

    _copyTableToYourAccount: function(e) {
      this.killEvent(e);
      var duplicate_dialog = new cdb.admin.DuplicateTableDialog({
         model: this.table,
         title: this._TEXTS.copy_table_dialog.title
      });
      duplicate_dialog
        .appendToBody()
        .open();
    }

  });


  cdb.init(function() {
    cdb.config.set(config);
    if (api_key) {
      cdb.config.set("api_key", api_key);
    }
    if (cdb.config.isOrganizationUrl()) {
      cdb.config.set('url_prefix', cdb.config.organizationUrl());
    }
    cdb.templates.namespace = 'cartodb/';

    // Store JS errors
    var errors = new cdb.admin.ErrorStats();

    // Main view
    var table = new TablePublic({
      table_id: table_id, 
      table_name: table_name,
      user_name: user_name,
      vizjson: vizjson,
      auth_token: auth_token,
      https: use_https,
      api_key: api_key,
      schema: schema,
      config: config
    });

    var table_router = new cdb.open.TableRouter(table);
    // expose to debug
    window.table = table;
    window.table_router = table_router;

    var pushState = true;
    var root = '/tables/';

    // Push state?
    if (!window.history || !window.history.pushState) pushState = false;

    // Organization user?
    if (belong_organization) root = '/u/' + user_name + root;

    Backbone.history.start({
      pushState: pushState,
      root:       root
    });

  });

  function renderExportOptions(table) {

    if (table && table.table) {
      var exportOptions = new cdb.admin.ExportTableOptions({
        model: table.table,
        config: config,
        sql: 'SELECT * FROM ' + table_name,
        force_http: location.protocol.indexOf('https') === -1 ? false : true,
        user_data: {
          api_key: cdb.config.get('api_key')
        }
      });

      $(".export_options .download_options").append(exportOptions.render().el);

    }
  }

  var onResize = function() {
    resizeWindow();
  };

  var doOnOrientationChange = function() {

    switch(window.orientation)
    {
      case -90:
        case 90: resizeWindow(true);
      break;
      default: resizeWindow(true);
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

  // Hide export options on mobile
  if (!mobileDevice) renderExportOptions(window.table);
  else {
    $(".export_options").addClass("disabled")
  }

  setTimeout(function() {

    resizeWindow();

    var windowHeight = $(window).height();
    var top = windowHeight - $(".cartodb-info").outerHeight(true) - $(".cartodb-public-header").outerHeight(true);

    if (mobileDevice) {
      var h = 120;

      if (windowHeight < 670) {
        h = 80;
      } 

      top = windowHeight - $(".cartodb-public-header").outerHeight(true) - h;
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
