
/**
 *  Tags dropdown view
 *
 */


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
    this.tags = this.options.tags;
    this.router = this.options.router;

    this.$target = this.options.target;

    // If any change happened in the tables or visualizations models, fetch tags model    
    this.visualizations.bind('add reset remove',  this._tableChange, this);
    this.tables.bind('add reset remove',          this._tableChange, this);

    this.tags.bind('sync', this.render, this);

    this.add_related_model(this.tags);
  },

  render: function() {
    var self = this;

    // Render
    var $el = this.$el;
    
    $el
      .html(this.template_base(this.options))
      .css({
        width: this.options.width
      })

    var selected = "";

    // Disabled?
    if (!_.size(this.tags.attributes)) {
      this.model.set("disabled", true);
    } else {
      this.model.set("disabled", false);
    }

    // Render dropdown list
    _.each(this.tags.attributes, function(tag) {

      if (self.router.model.get('tag') == tag.name) selected = "selected";
      else selected = "";

      var t = tag.name.replace(/'/g, "'");

      var $li = $("<li />");
      var $a = $("<a />");

      $li.append($a);

      $a.addClass(selected);
      $a.attr("href", "/tag/" + t);
      $a.attr("data-title", t);
      $a.text(self._cleanString(tag.name, 18));

      self.$el.find("ul").append($li);
    });

    return this;
  },

  // Clear the selected tag
  clear: function() {

    this.$el.find(".selected").removeClass("selected");
    this.model.set("name", null)

  },

  setTarget: function($el) {
    // UnBind old target
    this.$target.unbind({"click": this._handleClick});

    // Bind to new target
    this.$target = $el;
    this.$target.bind({"click": this._handleClick});

    // Check if target should be enabled
    this._toggleDisable();
  },

  _click: function(e) {

    e.preventDefault();
    e.stopPropagation();

    var name = $(e.target).attr("data-title");

    this.model.set("name", name);
    this.$el.find("." + name).addClass("selected");
    
    this.hide();
    
    this.trigger("tag", name, this);

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
      data: { type: this.router.model.get('model') === "tables" ? 'table' : 'derived' },
      success: function() {
        self.render();
        self.hide();
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