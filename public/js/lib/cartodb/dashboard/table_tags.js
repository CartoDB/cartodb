

(function() {

  /**
   * Create a new tag view
   */
  var TagView = cdb.core.View.extend({

    tagName: 'li',

    initialize: function() {
      this.template = cdb.templates.getTemplate('dashboard/views/table_tag_item');
    },

    render: function() {
      this.$el.html(this.template(this.options));

      return this;
    }
  });




  /**
   * Create a new tags view
   */
  var TagsView = cdb.core.View.extend({

    events: {},

    initialize: function() {

      _.bindAll(this, "render");

      // If any change happened in the tables model, fetch tags model
      this.options.tables.bind('reset',   this._tableChange, this);
      this.options.tables.bind('change',  this._tableChange, this);

      this.add_related_model(this.model);
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

      return this;
    }
  });

  cdb.admin.dashboard.TagsView = TagsView;
})();