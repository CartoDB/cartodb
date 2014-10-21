
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

        // Public visualizations
        if (this.options.visualizations && this.options.visualizations.length > 0) {
          var self = this;
          _.each(this.options.visualizations, function(url, i) {
            var options = {
              title:            false,
              header:           false,
              description:      false,
              search:           false,
              layer_selector:   false,
              text:             false,
              image:            false,
              shareable:        false,
              zoom:             false,
              cartodb_logo:     false,
              scrollwheel:      false,
              legends:          false,
              time_slider:      false,
              loader:           false,
              sublayer_options: url.layer_visibility,
              no_cdn:           self.options.no_cdn
            };

            cartodb.createVis('map_' + i , url.url, options);
          });
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
      var public_dashboard = new PublicDashboard({
        no_cdn:         window.no_cdn,
        visualizations: window.visualizations
      });
    });
  });
