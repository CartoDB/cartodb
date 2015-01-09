
  /**
   *  Public visualization model
   *
   */

  cdb.open.PublicVisualization = cdb.core.Model.extend({

    urlRoot: '/api/v1/viz',

    initialize: function() {

      this.like = new cdb.open.Like({ 
        id: this.get("liked") ? this.id : null,
        vis_id: this.id
      });

    },

    viewUrl: function() {
      return cdb.config.prefixUrl() + "/viz/" + this.id + "/";
    },

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

  });
