

(function() {

  /**
   * Create a new tag view
   *
   * Needs to know if the user is viewing a tag (current)
   *
   * Usage example:
   *
      var li = new TagView({ name: "protected areas", count: "3", current: "" });
   */
  var TagView = cdb.core.View.extend({

    tagName: 'li',

    initialize: function() {
      this.template = cdb.templates.getTemplate('dashboard/views/table_tag_item');

      this.bind("clean", this._reClean, this)
    },

    render: function() {
      var self = this;

      this.$el.html(this.template(this.options));
      this.$el.draggable({
        zIndex:9999,
        opacity: 1,
        helper: function(ev) {
          return $( "<a class='tag' href='#" + self.options.name + "'>" + self.options.name + "</a>" );
        }
      });

      return this;
    },

    /**
     * Destroy draggable before the element goes nowhere
     */
    _reClean: function() {
      this.$el.draggable("destroy")
    }
  });



  /**
   * Create a new tags view
   *
   * It will show the most popular tags of the user tables
   *
   * Usage example:
   *
      var tagsView = new cdb.admin.dashboard.TagsView({
        el: $('aside'),
        tables: this.tables*,
        model: this.tags**
      });

      *   It needs a tables model to run correctly.
      **  It needs a user model to run correctly.
   *
   */

  var TagsView = cdb.core.View.extend({

    events: {},

    initialize: function() {

      _.bindAll(this, "render");

      // If any change happened in the tables model, fetch tags model
      this.options.tables.bind('reset change add remove',   this._tableChange, this);

      this.options.tables.bind('tagRemoved tagAdded', this.render, this);

      this.add_related_model(this.model);
    },


    render: function(m) {

      var self = this
        , tag_name = this.options.tables.options.get("tag_name");

      this.clearSubViews();
      this.$el.html('');

      _.each(this.model.attributes,function(d) {
        var li = new TagView({ name: d.name, count: d.count, current: tag_name });
        self.$el.append(li.render().el);
        self.addView(li);
      });

      this.$el.prepend('<li><a href="#/" class="' + ((tag_name=="") ? "selected" : "" ) + '">all tables</a></a>');
      this.$el.prepend('<li><div class="removeTags">Drop here to remove your tag</div></a>');


      this.$('.removeTags').droppable({
        hoverClass: "drop",
        activeClass: "illuminate",
        drop: function( ev, ui ) {
          // a light delay is needed because if not, when the draggable element
          // is destroyed before the helper div is restored to the original position
          // there's a crash in jquery.
          setTimeout(function() {
            $(ui.draggable).trigger('removeTag');
          }, 25)
          }
      });

      return this;
    },


    /**
     *  When a table change, fetch tags model
     */
    _tableChange: function() {
      var self = this;
      this.model.fetch({
        data: {limit: "5"},
        success: this.render
      });
    }
  });

  cdb.admin.dashboard.TagsView = TagsView;
})();
