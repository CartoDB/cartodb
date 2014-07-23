
  /**
   *  Visualizations list view
   *
   *  - Render visualization items thanks to the collection
   */

  cdb.admin.dashboard.VisualizationsList = cdb.core.View.extend({

    initialize: function() {
      this.router = this.options.router;
      this._initBinds();
    },

    render: function() {
      this.clearSubViews();
      var self = this;

      this.collection.each(function(vis) {

        if (vis.get("type") != "table") {
          var vis_item = new cdb.admin.dashboard.VisualizationItem({
            model: vis,
            user: this.options.user,
            visualization_options: this.collection.options
          });
         
          vis_item.bind('tagClicked', this._onTagClicked, this);
          vis_item.bind('remove',     this._onVisualizationRemoved, this);

          this.$el.append(vis_item.render().el);
          this.addView(vis_item);
        }
      }, this);

      this._addPlaceholders();

    },

    _initBinds: function() {
      this.collection.bind('add remove reset', this.render, this);
    },

    _onTagClicked: function(tag) {
      var onlyMine = this.router.model.get('exclude_shared');
      var path = 'visualizations' + ( onlyMine ? '/mine' : '' ) + ( '/tag/' + tag );
      this.router.navigate(path, { trigger: true });
    },

    _onVisualizationRemoved: function(mdl, v) {
      this.trigger('onVisRemoved', this);
      mdl.destroy({ wait:true });
    },

    // Add empty visualizations placeholders
    _addPlaceholders: function() {

      var n = this.collection.size();

      if (n % 3 != 0) {

        var emptyVisNum = 3 - (n % 3);

        for (var i = 0; i < emptyVisNum; i++) {
          var item = new cdb.admin.dashboard.VisualizationItem();
          this.$el.append(item.render().el);
          this.addView(item);
        }
      }
    }

  });
