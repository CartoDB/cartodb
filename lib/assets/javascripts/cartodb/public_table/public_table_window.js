  
  /** 
   *  Public table window "view"
   *
   */

  cdb.open.PublicTableWindow = cdb.core.View.extend({

    initialize: function() {
      this.$body = $(this.el.document.body);
      this._initBinds();
      this._initViews();
      setTimeout(this._onStart, 250);
    },

    _initViews: function() {
      // Table view
      var table_options = _.defaults({ el: this.el.document.body }, this.options);
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

    _onWindowResize: function() {
      // Resize window
      this._resizeWindow();
      // Close dialogs
      cdb.god.trigger("closeDialogs");
    },

    _onOrientationChange: function() {
      // Reset disqus
      DISQUS.reset({ reload: true });
      // Resize window orientation
      this._resizeWindow(true)
    },

    // When window is resized, make some changes ;)
    _resizeWindow: function(animated) {
      var top           = 0;
      var tableHeight   = this.$body.find("table").outerHeight(true);
      var windowHeight  = this.$el.height();

      var heights = this.$body.find(".navigation").outerHeight(true) - this.$body.find(".cartodb-info").outerHeight(true) - this.$body.find(".cartodb-public-header").outerHeight(true);

      top = windowHeight - this.$body.find(".navigation").outerHeight(true) - this.$body.find(".cartodb-info").outerHeight(true) - this.$body.find(".cartodb-public-header").outerHeight(true);

      if (this.options.isMobileDevice) {
        var h = 120;
        if (windowHeight < 670) { h = 80 } 
        top = windowHeight - this.$body.find(".navigation").outerHeight(true) - this.$body.find(".cartodb-public-header").outerHeight(true) - h;
      }

      if (animated) {
        this.$body.find(".cartodb-map-data").animate({ top: top }, { easing: "easeInQuad", duration: 150 }); 
        this.$body.find("> .separator").animate({ top: top + 1}, { easing: "easeInQuad", duration: 150 }).show(); 
        this.$body.find("> .separator_shadow").animate({ top: top + 2 }, { easing: "easeInQuad", duration: 150 }).show();
        this.$body.find(".navigation").animate({ top: top - 30 }, { easing: "easeInQuad", duration: 150 }); 
      } else {
        this.$body.find(".cartodb-map-data").css({ top: top }); 
        this.$body.find("> .separator").css({ top: top + 1}).show(); 
        this.$body.find("> .separator_shadow").css({ top: top + 2 }).show();
        this.$body.find(".navigation").css({ top: top - 30 }, 250); 
      }
   
      var height = windowHeight - this.$body.find(".cartodb-info").outerHeight(true) - this.$body.find(".cartodb-public-header").outerHeight(true);

      if (this.options.isMobileDevice) {
        height = windowHeight - this.$body.find(".cartodb-public-header").outerHeight(true) - 79;
      }

      if (this.$body.hasClass("map")) {

        if (animated) {
          this.$body.find(".panes").animate({ height: height + 69 }, { easing: "easeInQuad", duration: 150 });
        } else {
          this.$body.find(".panes").css({ height: height + 69 }); 
        }

      } else {

        if (animated) {
          this.$body.find(".panes").css({ height: height }, { easing: "easeInQuad", duration: 150 }); 
        } else {
          this.$body.find(".panes").css({ height: height });
        }

      }
    },

    // On start view!
    _onStart: function() {
      this._resizeWindow();

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

    // Show navigation (table or map view) block
    _showNavigationBar: function(top) {
      var windowHeight = this.$el.height();

      this.$body.find(".navigation")
        .css({ top: windowHeight }) 
        .animate({ top: top - 60, opacity: 1 }, 250); 
    }

  });