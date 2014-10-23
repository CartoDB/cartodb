  
  /** 
   *  Public map window "view"
   *
   */

  cdb.open.PublicMapWindow = cdb.core.View.extend({

    initialize: function() {
      this.$body = $(this.el.document.body);
      this._setupMapDimensions();
      this._initBinds();
      this._initViews();
    },

    _initViews: function() {
      // Map view
      var opts = _.defaults({ el: this.el.document.body }, this.options);
      this.map_view = new cdb.open.MapPublic(opts);
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
      DISQUS.reset({ reload: true });
      // Resize window orientation
      this._setupMapDimensions(true);
    },

    // When window is resized, make some changes ;)
    _setupMapDimensions: function(animated) {
      var windowHeight = this.$el.height();
      var h, height, top;

      if (this.options.isMobileDevice) {

        if (windowHeight > 670) {
          h = 180;
        } else { // iPhone, etc.
          h = 100;
        }

      } else {
        h = 260;
      }

      height = windowHeight - h;
      top    = windowHeight - (h - 67);

      if (animated) {
        this.$body.find("#map").animate({ height: height }, { easing: "easeInQuad", duration: 150 }); 
      } else {

        if (this.options.isMobileDevice) {
          this.$body.find("#map").css({ height: height, opacity: 1 }); 
        } else {
          // On non mobile devices
          this.$body.find("#map").css({ height: windowHeight - 194, opacity: 1 })
        }
      }

      if (this.map_view) this.map_view.invalidateMap();
    }

  });