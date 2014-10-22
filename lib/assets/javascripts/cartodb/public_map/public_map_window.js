  
  /** 
   *  Public map window "view"
   *
   */

  cdb.open.PublicMapWindow = cdb.core.View.extend({

    initialize: function() {
      this.$body = $(this.el.document.body);
      this._initBinds();
      this._initViews();
      setTimeout(this._onStart, 250);
    },

    _initViews: function() {
      // Map view
      var opts = _.defaults({ el: this.el.document.body }, this.options);
      this.map_view = new cdb.open.MapPublic(opts);
      this.addView(this.map_view);
    },

    _initBinds: function() {
      _.bindAll(this, '_onWindowResize', '_onOrientationChange', '_onStart');

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

          this.$body.find("#map")
            .css({ height: windowHeight - 194 })
            .delay(500)
            .animate({ opacity: 1 }, 250); 
        }

      }

      if (this.map_view) this.map_view.invalidateMap();
    },

    // On start view!
    _onStart: function() {
      // Triggers window resize to calculate proper map height
      // and overlays position
      $(window).trigger('resize');
      
      // this._setupMapDimensions();
      // fixes default position of the overlays? -> ac372453e4a3d03304a2e6f07570c97bb5d32fd0
      // this.$el.trigger("map_resized");
    }

  });