var $ = require('jquery');
var cdb = require('cartodb.js');
var PublicMap = require('./public_map_view');
  
/** 
 *  Public map window "view"
 *
 */

module.exports = cdb.core.View.extend({

  initialize: function() {
    this.$body = $(this.el.document.body);
    this.$map = this.$body.find('#map');
    this._setupMapDimensions();
    this._initBinds();
    this._initViews();
  },

  _initViews: function() {
    // Map view
    this.map_view = new PublicMap(_.defaults({ el: this.$map }, this.options));
    // this.map_vis.bind('map_error', this._showNotSupportedDialog, this);
    // this.map_vis.bind('map_loaded', function(vis) { this.trigger('map_loaded', vis, this) }, this);
    // this.addView(this.map_vis);
    // this.map_view.bind('map_loaded', this._onMapLoaded, this);
    this.addView(this.map_view);
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

  // When window is resized, make some changes ;)
  _setupMapDimensions: function(animated) {
    var windowHeight = this.$el.height();
    var mainInfoHeight = this.$body.find('.PublicMap-title').height() + 90 /* meta + margins */;
    var headerHeight = this.$body.find('.Header').height();
    var h, height, top;

    if (this.options.isMobileDevice) {

      if (windowHeight > 670) {
        h = 220;
      } else { // iPhone, etc.
        h = 140;
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

    if (this.map_view) this.map_view.invalidateMap();
  }

});