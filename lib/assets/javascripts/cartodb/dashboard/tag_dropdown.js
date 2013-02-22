
cdb.admin.TagDropdown = cdb.ui.common.Dropdown.extend({

  events: {

    "click li a" : "_click"

  },

  initialize: function() {

    this.constructor.__super__.initialize.apply(this);

    _.bindAll(this, "render");

    this.model = new cdb.core.Model();

    // If any change happened in the tables model, fetch tags model
    this.options.tables.bind('change:tags reset remove', this._tableChange, this);

    this.tags = this.options.tags;
    this.tags.bind('sync', this.render, this);

    this.add_related_model(this.tags);
    this.add_related_model(this.model);
  },

  _click: function(e) {

    var name = $(e.target).html();

    this.model.set("name", name);
    this.$el.find("." + name).addClass("selected");

  },

  /**
  *  When a table change, fetch tags model
  */
  _tableChange: function() {
    var self = this;
    this.tags.fetch({
      success: this.render
    });
  },

  _center: function(e, target) {
    // Target
    var $target = target && $(target) || this.options.target;
    this.options.target = $target;

    var targetPos   = $target[this.options.position || 'offset']()
    , targetWidth   = $target.outerWidth()
    , targetHeight  = $target.outerHeight()
    , elementWidth  = this.$el.outerWidth()
    , elementHeight = this.$el.outerHeight()
    , self = this;

    this.$el.css({
      top: targetPos.top + parseInt((self.options.vertical_position == "up") ? (- elementHeight - 10 - self.options.vertical_offset) : (targetHeight + 10 - self.options.vertical_offset)),
      left: targetPos.left + parseInt((self.options.horizontal_position == "left") ? (self.options.horizontal_offset - 15) : (targetWidth - elementWidth + 15 - self.options.horizontal_offset))
    })
    .addClass(
      // Add vertical and horizontal position class
      (this.options.vertical_position == "up" ? "vertical_top" : "vertical_bottom" )
      + " " +
        (this.options.horizontal_position == "right" ? "horizontal_right" : "horizontal_left" )
      + " " +
        // Add tick class
        "tick_" + this.options.tick
    );

  },

  open: function(e, target) {

    var self = this;

    this._center(e, target);

    this.$el.find("ul").empty();

    var selected = "";

    _.each(this.tags.attributes, function(tag) {

      if (self.model.get("name") == tag.name) selected = "selected ";
      else selected = "";

      self.$el.find("ul").append("<li><a class='" + selected + tag.name + "' href='#/tag/" + tag.name + "/" + tag.count + "'>" + tag.name + "</a></li>");
    });

    this.options.target.addClass("selected");

    // Show it
    this.show();

    // Dropdown openned
    this.isOpen = true;
  },

  hide: function() {
    this.isOpen = false;
    this.$el.hide();
    this.options.target.removeClass("selected");
  }

});
