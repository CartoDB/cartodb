
  /** 
   *  Public table window "view"
   *
   */

  cdb.open.PublicTableWindow = cdb.core.View.extend({

    initialize: function() {
      this.$body = $(this.el.document.body);
      this.$map = this.$body.find('#map');
      this._initBinds();
      this._initViews();
      setTimeout(this._onStart, 250);
    },

    _initViews: function() {
      // Table view
      var table_options = _.defaults({ el: this.el.document.body, model: new cdb.core.Model({ bounds: false, map: null }) }, this.options);
      var table = new cdb.open.TablePublic(table_options);

      // Public table router
      this.el.table_router = new cdb.open.TableRouter(table);

      var pushState = true;
      var root = '/tables/';

      // Push state?
      if (!this.el.history || !this.el.history.pushState) pushState = false;

      // Organization user?
      if (this.options.belong_organization) root = '/u/' + this.options.user_name + root;

      Backbone.history.start({
        pushState:  pushState,
        root:       root
      });
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

    // On start view!
    _onStart: function() {
      this._setupMapDimensions();

      var windowHeight = this.$el.height();
      var top = windowHeight - this.$body.find(".cartodb-info").outerHeight(true) - this.$body.find(".cartodb-public-header").outerHeight(true);

      if (this.options.isMobileDevice) {
        var h = 120;

        if (windowHeight < 670) {
          h = 80;
        }

        top = windowHeight - this.$body.find(".cartodb-public-header").outerHeight(true) - h;
      }

      this._showNavigationBar(top)
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
          h = headerHeight + 7;
        } else {
          if (windowHeight > 670) {
            h = 220;
          } else { // iPhone, etc.
            h = 138;
          }
        }
      } else {
        h = 260;
      }

      height = windowHeight - h;
      top    = windowHeight - (h - 80);

      if (animated) {
        this.$map.animate({ height: height }, { easing: "easeInQuad", duration: 150 });
        this.$body.find(".navigation").animate({ top: top - 130 }, { easing: "easeInQuad", duration: 150 });
      } else {
        if (this.options.isMobileDevice) {
          this.$map.css({ height: height, opacity: 1 }); 
          this.$body.find(".navigation").css({ top: top - 130 }, 250);
        } else {
          // On non mobile devices
          this.$map.css({ height: windowHeight - ( mainInfoHeight + headerHeight), opacity: 1 });
          this.$body.find(".navigation").css({ top: top - 21 }, 250);
        }
      }

      // If landscape, let's scroll to show the map, and
      // leave the header hidden
      if (this.options.isMobileDevice && landscapeMode && $(window).scrollTop() < headerHeight) {
        this.$body.animate({ scrollTop: headerHeight }, 600);
      }

      if (this.map_view) this.map_view.invalidateMap();
    },

    // Show navigation (table or map view) block
    _showNavigationBar: function(top) {
      var landscapeMode = this.el.matchMedia && this.el.matchMedia("(orientation: landscape)").matches;
      var windowHeight = this.$el.height();

      if (this.options.isMobileDevice) {
        var top_ = 108;

        if (landscapeMode) {
          top_ = 48;
        }

        this.$body.find(".navigation")
          .css({ top: windowHeight })
          .animate({ top: top - top_, opacity: 1 }, 250);
      } else {
        this.$body.find(".navigation")
          .css({ top: windowHeight })
          .animate({ top: top - 201, opacity: 1 }, 250);
      }

      if (this.map_view) this.map_view.invalidateMap();
    }

  });
