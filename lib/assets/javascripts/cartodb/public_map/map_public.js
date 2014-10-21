  
  /** 
   *  Public map "view"
   *
   */


  cdb.open.MapPublic = cdb.core.View.extend({

    el: document.body,

    events: {
      'click .edit':  '_editVis',
      'click .clone': '_copyVisToYourAccount',
      'click':        '_onClick'
    },

    _TEXTS: {
      copy_vis_dialog: {
        title:  _t('Name for your copy of this visualization'),
      }
    },

    initialize: function() {
      this.authenticated_user = new cdb.open.AuthenticatedUser();
      this.vis = new cdb.open.PublicVisualization({
        id:   this.options.vis_id,
        name: this.options.vis_name
      });
      this._initViews();
      this._initBinds();
      
      this.authenticated_user.fetch();
    },

    _initBinds: function() {
      this.authenticated_user.bind('change', this._onUserLogged, this);
      this.add_related_model(this.authenticated_user);
    },

    _initViews: function(e) {
      // Public header
      if (this.$('.cartodb-public-header').length > 0) {
        var header = new cdb.open.Header({
          el: this.$('.cartodb-public-header'),
          model: this.authenticated_user,
          current_view: this._getCurrentView(),
          owner_username: this.options.owner_username,
          vis: this.vis,
          isMobileDevice: this.options.isMobileDevice
        });
        this.addView(header);
      }

      // Tipsy for help
      this.$("span.help").tipsy({ gravity: $.fn.tipsy.autoBounds(250, 's'), fade: true });

      // Check if comments are available for user browser
      if ($.browser.msie && parseInt($.browser.version) == 7 ) {
        this.$(".comments .content").html("<p>Your browser doesn't support comments.</p>")
      }

      // Public vis
      var map_vis = new cdb.open.PublicVis(_.defaults({ el: this.$('#map') }, this.options));
      this.addView(map_vis);
    },

    _onClick: function() {
      cdb.god.trigger("closeDialogs");
    },

    // Get type of current view
    // - It could be, dashboard, table or visualization
    _getCurrentView: function() {
      var pathname = location.pathname;
      
      if (pathname.indexOf('/tables/') !== -1 ) {
        return 'table';
      }

      if (pathname.indexOf('/viz/') !== -1 ) {
        return 'visualization';
      }

      // Other case -> dashboard (datasets, visualizations,...)
      return 'dashboard';

    },

    _onUserLogged: function() {
      // Check if clone button should be visible
      if (this.authenticated_user.get('can_fork') && this.options.owner_username !== this.options.user_name) {
        this.$('.export_options .clone').css('display', 'inline-block');
      }

      // Check if edit button should be visible
      if (this.options.owner_username === this.options.user_name) {
        this.$('.export_options .edit').css('display', 'inline-block');
      }
    },

    _editVis: function(e) {
      if (e) this.killEvent(e);
      window.location.href = this.vis.viewUrl();
    },

    _copyVisToYourAccount: function(e) {
      this.killEvent(e);
      
      var dlg = new cdb.admin.DuplicateVisDialog({
        model: this.vis,
        title: this._TEXTS.copy_vis_dialog.title
      });

      dlg
        .appendToBody()
        .open();
    }

  });