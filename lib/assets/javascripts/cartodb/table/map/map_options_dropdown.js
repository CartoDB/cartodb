cdb.admin.MapOptionsDropdown = cdb.ui.common.Dropdown.extend({

  className: 'dropdown map_options_dropdown',

  defaults: {
    speedOut: 100,
    speedIn: 100
  },

  events: {

    "click" : "killEvent",

  },

  initialize: function() {

    _.bindAll(this, "open", "hide", "_handleClick", "_onKeyDown");

    // Extend options
    _.defaults(this.options, this.defaults);

    this.collection.on("reset", this._setupOptions, this);

    this.mapOptions = new cdb.core.Model({
      title:            false,
      description:      false,
      search:           false,
      shareable:        true,
      cartodb_logo:     true,
      layer_selector:   false,
      scrollwheel:      true,
      fullscreen:       true
    });

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Bind to target
    $(this.options.target).bind({ "click": this._handleClick});
    $(this.options.target).bind({ "dblclick": this.killEvent});

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    // Is open flag
    this.isOpen = false;

  },

  _setupOptions: function() {

    var self = this;
    var overlays = this.collection.filter(function(m) { return m.get("type") == "title" });

    _.each(overlays, function(overlay) {

      var extra = overlay.get("extra");

      var show_title       = extra.show_title;
      var show_description = extra.show_description;

      self.mapOptions.set({ title: show_title, description: show_description });

      if (show_title)       self.$el.find(".title").removeClass("disabled");
      if (show_description) self.$el.find(".description").removeClass("disabled");

    });

  },

  /* Check if the dropdown is visible to hiding with the click on the target */
  _handleClick: function(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    // If visible
    if (this.isOpen){
      this.hide();
    } else{
      this.open();
    }
  },

  show: function() {

    var dfd = $.Deferred();
    var self = this;

    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();
    this.$el
    .css({
      marginTop: self.options.vertical_position == "down" ? "-10px" : "10px",
      opacity:0,
      display:"block"
    })
    .animate({
      margin: "0",
      opacity: 1
    }, {
      "duration": this.options.speedIn,
      "complete": function(){
        dfd.resolve();
      }
    });

    this.trigger("onDropdownShown", this.el);

    return dfd.promise();
  },

  open: function(ev, target) {

    // Target
    var $target = target && $(target) || this.options.target;

    this.options.target = $target;

    this.$el.css({
      bottom: 40,
      left: this.options.horizontal_offset
    })
    .addClass(
      // Add vertical and horizontal position class
      (this.options.vertical_position == "up" ? "vertical_top" : "vertical_bottom" )
      + " " +
        (this.options.horizontal_position == "right" ? "horizontal_right" : "horizontal_left" )
      + " " +
        // Add tick class
        "border tick_" + this.options.tick
    );

    // Show it
    this.show();
    this._recalcHeight();

    // Dropdown open
    this.isOpen = true;
  },

  _onKeyDown: function(e) {

    if (e.keyCode === 27) {
      this.hide();
    }

  },


  hide: function(done) {

    if (!this.isOpen) {
      done && done();
      return;
    }

    var self    = this;
    this.isOpen = false;

    this.$el.animate({
      marginTop: self.options.vertical_position == "down" ? "10px" : "-10px",
      opacity: 0
    }, this.options.speedOut, function(){

      // And hide it
      self.$el.hide();

    });

    this.trigger("onDropdownHidden",this.el);
  },

  _recalcHeight: function() {

    var $ul  = this.$el.find("ul.special");

    // Resets heights
    $ul.height("auto");
    $ul.parent().height("auto");

    var special_height  = $ul.height();
    var dropdown_height = $ul.parent().height();

    // Sets heights
    if (special_height < dropdown_height) $ul.css("height", dropdown_height);
    else $ul.parent().height(special_height);

  },

  _addSwitches: function(switches) {

    var self = this;

    _(switches).each(function(prop) {

      var className = '.' + prop;

      var sw = new cdb.forms.Switch({
        model: self.mapOptions,
        property: prop
      }).bind("switched", self._onSwitchSwitched, self);

      self.addView(sw);

      self.$("li" + className).append(sw.render().el);
      if (!self.mapOptions.attributes[prop]) self.$(className).addClass("disabled");

    });

  },

  _onSwitchSwitched: function(property, value) {

    if (property == 'title' || property == "description") {

      var overlays         = this.collection.filter(function(m) { return m.get("type") == "title" });

      var show_title       = this.mapOptions.get("title");
      var show_description = this.mapOptions.get("description");

      var display = show_title || show_description;

      _.each(overlays, function(overlay){
        overlay.set({ display: display, show_title: show_title, show_description: show_description });
        overlay.save();
      });

    }

    value ? this.$("li." + property).removeClass("disabled") : this.$("li." + property).addClass("disabled");
  },

  /*
   * Renders the dropdown
   */
  render: function() {

    this.clearSubViews();

    this.$el.html(this.template_base(this.options));

    this._addSwitches(['title', 'description'/*, 'search', 'shareable', 'cartodb_logo', 'layer_selector', 'legends', 'fullscreen', 'scrollwheel'*/]);

    return this;
  }
});
