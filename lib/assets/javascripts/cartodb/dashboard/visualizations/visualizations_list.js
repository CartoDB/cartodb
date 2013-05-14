
  /**
   *  Visualizations list
   */

  cdb.admin.dashboard.VisualizationsList = cdb.core.View.extend({

    initialize: function() {
      this.collection.bind('add remove reset', this.render, this);
    },

    render: function() {
      this.clearSubViews();
      var self = this;

      this.collection.each(function(vis) {
        if (vis.get("type") != "table") {
          var item = new cdb.admin.dashboard.VisualizationItem({
            model: vis
          })
          .bind('remove', function() {
            this.model.destroy();
          });

          self.$el.append(item.render().el);
          self.addView(item);
        }
      });
    }
  });



  /**
   *  Visualization list item renderer
   */

  cdb.admin.dashboard.VisualizationItem = cdb.core.View.extend({
    tagName: 'li',

    _TAGS_PER_ITEM: 15,

    events: {
      'click a.delete': '_deleteVis'
    },

    initialize: function() {
      _.bindAll(this, '_destroy');
      this.template = cdb.templates.getTemplate('dashboard/views/visualization_list_item');
    },

    _generateTagList: function(tags) {

      if (!tags) return;

      var template = _.template('<a href="/#/<%= tag %>"><%= tag %></a>');

      return _.map(tags, function(t) {
        return template({ tag: t });
      }).reverse().slice(0, this._TAGS_PER_ITEM).join(" ");

    },

    render: function() {

      var tags = this._generateTagList(this.model.get("tags"));
      this.$el.append(this.template(_.extend(this.model.toJSON(), { tags: tags } )));
      this.$('a.delete').tipsy({ gravity: 's', fade: true });
      return this;

    },

    _deleteVis: function(e) {
      this.killEvent(e);

      var dlg = new cdb.admin.DeleteVisualizationDialog();
      this.$el.append(dlg.render().el);

      dlg.ok = this._destroy;
      dlg.open();
    },

    _destroy: function() {
      this.trigger('remove');
    },

    clean: function() {
      // Remove tipsy
      if (this.$("a.delete").data('tipsy')) {
        this.$("a.delete").unbind('mouseenter mouseleave');
        this.$("a.delete").data('tipsy').remove();
      }
      cdb.core.View.prototype.clean.call(this);
    }
  })
