var $ = require('jquery-cdb-v3');
var cdb = require('cartodb.js-v3');
var PublicMap = require('./public_map_view');
var ExportMapView = require('../common/dialogs/export_map/export_map_view');
var ExportMapModel = require('../models/export_map_model.js');

/** 
 *  Public map window "view"
 *
 */

module.exports = cdb.core.View.extend({

  events: {
    'click .js-Navmenu-link--download-map': '_exportMap'
  },

  _exportMap: function (e) {
    e.preventDefault();

    var view = new ExportMapView({
      model: new cdb.admin.ExportMapModel({ 'visualization_id': vis_id }),
      clean_on_hide: true,
      enter_to_confirm: true
    });

    view.appendToBody();
  },

  initialize: function() {
    this.$body = $(this.el.document.body);
    this.$map = this.$body.find('#map');
    this._setupMapDimensions();
    this._initBinds();
    this._initViews();
  },

  _initViews: function() {
    // Map view
    this.mapView = new PublicMap(_.defaults({ el: this.$map }, this.options));
    this.mapView.bind('map_error', this._showNotSupportedDialog, this);
    
    this.addView(this.mapView);
  },

  _initBinds: function() {
    _.bindAll(this, '_onWindowResize', '_onOrientationChange');

    this.$el.on('resize', this._onWindowResize);

    if (!this.el.addEventListener) {
      this.el.attachEvent('orientationchange', this._onOrientationChange, this);
    } else {
      this.el.addEventListener('orientationchange', this._onOrientationChange);
    }
  },

  _showNotSupportedDialog: function() {
    this.$body.find('#not_supported_dialog').show();
  },

  _onWindowResize: function() {
    // Resize window
    this._setupMapDimensions();
    // Close dialogs
    cdb.god.trigger("closeDialogs");
  },

  _onOrientationChange: function() {
    // Reset disqus
    DISQUS && DISQUS.reset({ reload: true });
    // Resize window orientation
    this._setupMapDimensions(true);
  },

  // When window is resized, let's touch some things ;)
  _setupMapDimensions: function(animated) {
    var windowHeight = this.$el.height();
    var mainInfoHeight = this.$body.find('.js-Navmenu').height();
    var headerHeight = this.$body.find('.Header').height();
    var landscapeMode = this.el.matchMedia && this.el.matchMedia("(orientation: landscape)").matches;
    var h, height, top;

    if (this.options.isMobileDevice) {

      if (landscapeMode) {
        h = headerHeight - 20;
      } else {
        if (windowHeight > 670) {
          h = 220;
        } else { // iPhone, etc.
          h = 140;
        }        
      }
    } else {
      h = 260;
    }

    height = windowHeight - h;
    top    = windowHeight - (h - 80);

    if (animated) {
      this.$map.animate({ height: height }, { easing: "easeInQuad", duration: 150 }); 
    } else {

      if (this.options.isMobileDevice) {
        this.$map.css({ height: height, opacity: 1 }); 
      } else {
        // On non mobile devices
        this.$map.css({ height: windowHeight - ( mainInfoHeight + headerHeight), opacity: 1 })
      }
    }

    // If landscape, let's scroll to show the map, and
    // leave the header hidden
    if (this.options.isMobileDevice && landscapeMode && $(window).scrollTop() < headerHeight) {
      this.$body.animate({ scrollTop: headerHeight }, 600);
    }

    if (this.map_view) this.map_view.invalidateMap();
  }

});
