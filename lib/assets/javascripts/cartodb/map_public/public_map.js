
  /**
   *  Necessary tasks for public map(vis) view
   *
   */

  cdb.open.PublicVisualization = cdb.core.Model.extend({

    urlRoot: '/api/v1/viz',

    copy: function(attrs, options) {
      attrs = attrs || {};
      options = options || {};
      var vis = new cdb.open.PublicVisualization(
        _.extend({
            source_visualization_id: this.id
          },
          attrs
        )
      );
      vis.save(null, options);
      return vis;
    }

  })


  $(function() {

    // Public map
    var PublicMap = cdb.core.View.extend({
      
      el: document.body,

      events: {
        'click': '_onClick'
      },

      initialize: function() {
        this.model = new cdb.open.AuthenticatedUser();
        this.vis = new cdb.open.PublicVisualization({
          id:   this.options.vis_id,
          name: this.options.vis_name
        });
        this._initViews();
        this.model.fetch();
      },

      _initViews: function(e) {
        // Public header
        if (this.$('.cartodb-public-header').length > 0) {
          var header = new cdb.open.Header({
            el: this.$('.cartodb-public-header'),
            model: this.model,
            current_view: this._getCurrentView(),
            owner_username: this.options.owner_username,
            vis: this.vis
          });
          this.addView(header);
        }

        // Tipsy for help
        this.$("span.help").tipsy({ gravity: $.fn.tipsy.autoBounds(250, 's'), fade: true });

        // Check if comments are available for user browser
        if ($.browser.msie && parseInt($.browser.version) == 7 ) {
          this.$(".comments .content").html("<p>Your browser doesn't support comments.</p>")
        }

        // Fork button 
        console.log("TODO fork button below user avatar");
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

      }
    });

    cdb.init(function() {
      window.public_map = new PublicMap({
        owner_username: window.owner_username,
        vis_id:         window.vis_id,
        vis_name:       window.vis_name
      });
    });
  });
