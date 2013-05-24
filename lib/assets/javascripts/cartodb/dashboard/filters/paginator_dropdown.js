cdb.admin.PaginatorDropdown = cdb.ui.common.Dropdown.extend({

  events: {

    "click li a" : "_click"

  },

  initialize: function() {

    this.constructor.__super__.initialize.apply(this);

    _.bindAll(this, "render");

    this.model = new cdb.core.Model();

    //this.tables = this.options.tables;

    this.$target = this.options.target;

    // If any change happened in the tables model, fetch tags model
    //this.tables.bind('change:tags reset remove', this._tableChange, this);
    //this.model.bind('change:type', this._tableChange, this);

    this.pages = this.options.pages;
    //this.tags.bind('sync', this.render, this);

    //this.add_related_model(this.tags);
    //this.add_related_model(this.model);
  },

  // Clear the selected tag
  clear: function() {

    this.$el.find(".selected").removeClass("selected");
    this.model.set("name", null)

  },

  _click: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var name = $(e.target).html();

    this.model.set("name", name);
    this.$el.find("." + name).addClass("selected");

    this.hide();

    this.trigger("onClick", e, this);

  },

  /**
  *  When a table change, fetch tags model
  */
  _tableChange: function() {
    var self = this;
    this.tags.fetch({
      data: {
        type: self.model.get("type")
      },
      success: function() {
        self.render();

        if (!_.size(self.tags.attributes)) {
          self.$target.hide();
        } else self.$target.show();

      }
    });

  },

  _center: function(e, target) {
    // Target
    var $target = target && $(target) || this.$target;

    var targetPos   = $target[this.options.position || 'offset']()
    , targetWidth   = $target.outerWidth()
    , targetHeight  = $target.outerHeight()
    , elementWidth  = this.$el.outerWidth()
    , elementHeight = this.$el.outerHeight()
    , self = this;

    this.$el.css({
      top: targetPos.top - this.$el.height() - self.options.vertical_offset,// parseInt((self.options.vertical_position == "up") ? (- elementHeight - 10 - self.options.vertical_offset) : (targetHeight + 10 - self.options.vertical_offset)),
      left: targetPos.left + parseInt((self.options.horizontal_position == "left") ? (self.options.horizontal_offset ) : (targetWidth - elementWidth - self.options.horizontal_offset))
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

    this.$el.find("ul").empty();

    _.each(this.pages, function(page) {
      self.$el.find("ul").append("<li><a class='" + (self.options.current_page == page ? "selected" : "") + "' href='" + self.options.path + "/" + page + "'>" + page + "</a></li>");
    });

    this.$target.addClass("selected");

    // Show it
    this.show();

    this._center(e, target);

    // Dropdown openned
    this.isOpen = true;
  },

  hide: function() {
    this.isOpen = false;
    this.$el.hide();
    this.$target.removeClass("selected");
  }

});
