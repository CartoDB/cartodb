
cdb.admin.TagDropdown = cdb.ui.common.Dropdown.extend({

  events: {

    "click li a" : "_click"

  },

  initialize: function() {

    this.constructor.__super__.initialize.apply(this);

    _.bindAll(this, "render");

    this.model = new cdb.core.Model();

    this.model.bind("change:disabled", this._toggleDisable, this);

    this.tables = this.options.tables;
    this.visualizations = this.options.visualizations;

    this.$target = this.options.target;

    // If any change happened in the tables or visualizations models, fetch tags model    
    this.visualizations.bind('change:tags add reset remove',  this._tableChange, this);
    this.tables.bind('change:tags add reset remove',          this._tableChange, this);

    this.tags = this.options.tags;
    this.tags.bind('sync', this.render, this);

    this.add_related_model(this.tags);
    this.add_related_model(this.model);
  },

  // Clear the selected tag
  clear: function() {

    this.$el.find(".selected").removeClass("selected");
    this.model.set("name", null)

  },

  _click: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var name = $(e.target).attr("data-title");

    this.model.set("name", name);
    this.$el.find("." + name).addClass("selected");

    this.tables.options.set({ tags: name, per_page: 3 });
    this.tables.fetch();

    this.hide();

    this.trigger("tag", { model: this.model.get("type"), tag: name }, this);

  },

  _toggleDisable: function() {

    if (this.model.get("disabled")) {
      this.$target.addClass("disabled");
    } else {
      this.$target.removeClass("disabled");
    }

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
          self.model.set("disabled", true);
        } else {
          self.model.set("disabled", false);
          self.$target.show();
        }

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
  _cleanString: function(s, n) {

    if (s) {
      s = s.replace(/<(?:.|\n)*?>/gm, ''); // strip HTML tags
      s = s.substr(0, n-1) + (s.length > n ? '&hellip;' : ''); // truncate string
    }

    return s;

  },


  open: function(e, target) {

    var self = this;

    if (this.model.get("disabled")) return;

    this._center(e, target);

    this.$el.find("ul").empty();

    var selected = "";

    _.each(this.tags.attributes, function(tag) {

      if (self.model.get("name") == tag.name) selected = "selected";
      else selected = "";

      self.$el.find("ul").append("<li><a class='" + selected + "' href='/tag/" + tag.name + "' data-title='" + tag.name + "'>" + self._cleanString(tag.name, 18) + "</a></li>");
    });

    this.$target.addClass("selected");

    // Show it
    this.show();

    // Dropdown openned
    this.isOpen = true;
  },

  hide: function() {
    this.isOpen = false;
    this.$el.hide();
    this.$target.removeClass("selected");
  }

});
