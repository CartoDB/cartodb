
  /**
   *  Necessary tasks for public dashboard view
   *
   */

  $(function() {

    // Public dashboard view
    var PublicDashboard = cdb.core.View.extend({
      
      el: document.body,

      events: {
        'click': '_onClick'
      },

      initialize: function() {
        this.model = new cdb.open.AuthenticatedUser();
        this._initViews();
        this.model.fetch();
      },

      _initViews: function(e) {
        // Public header
        if (this.$('.cartodb-public-header').length > 0) {
          var header = new cdb.open.Header({
            el: this.$('.cartodb-public-header'),
            model: this.model,
            current_view: this._getCurrentView()
          });
          this.addView(header);
        }
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

      _onClick: function() {
        cdb.god.trigger("closeDialogs");
      }

    });

    cdb.init(function() {
      window.public_dashboard = new PublicDashboard();
    });
  });
