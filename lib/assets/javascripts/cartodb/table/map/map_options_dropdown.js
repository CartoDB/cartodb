cdb.admin.MapOptionsDropdown = cdb.ui.common.Dropdown.extend({

  className: 'dropdown map_options_dropdown',

  defaults: {
    speedOut: 90,
    speedIn:  90
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
      layer_selector:   false,
      fullscreen:       false,
      share:            true,
      logo:             true,
      zoom:             true,
      scrollwheel:      true,
      legends:          true
    });

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    this.options.vis.bind("change:canvas_mode", this._onChangeDevice, this);

    // Bind to target
    $(this.options.target).bind({ "click": this._handleClick});
    $(this.options.target).bind({ "dblclick": this.killEvent});

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    // Is open flag
    this.isOpen = false;

  },

  _onChangeDevice: function() {

    var device = this.options.vis.get("canvas_mode");

    var disableOverlays = ["search", "shareable", "zoom", "zoom_info", "share", "fullscreen", "layer_selector"];

    if (device == 'mobile') {

      _.each(disableOverlays, function(overlay) {

        this.$el.find("." + overlay).addClass("inactive");
        this.$el.find("." + overlay + " .form_switch").addClass("inactive");

      }, this);

    } else {

      _.each(disableOverlays, function(overlay) {

        this.$el.find("." + overlay).removeClass("inactive");
        this.$el.find("." + overlay + " .form_switch").removeClass("inactive");

      }, this);

    }
  },

  _setupOptions: function() {

    var self = this;
    var overlays = this.collection.models;

    var simpleOverlays = ["search", "shareable", "zoom", "zoom_info", "share", "fullscreen", "layer_selector", "logo"];

    if (!this.options.vis.map.get("scrollwheel")) this.mapOptions.set({ scrollwheel: false });

    _.each(overlays, function(overlay) {

      var extra = overlay.get("extra");
      var type  = overlay.get("type");

      if (type == "header") {

        var show_title       = extra.show_title;
        var show_description = extra.show_description;

        self.mapOptions.set({ title: show_title, description: show_description });

        if (show_title)       self.$el.find(".title").removeClass("disabled");
        if (show_description) self.$el.find(".description").removeClass("disabled");

      } else if (_.contains(simpleOverlays, type)) {

        var display = overlay.get("display");
        self.mapOptions.set(type, display);

        if (display) self.$el.find("." + type).removeClass("disabled");

      }

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

    _(switches).each(this._addSwitch, this);

  },

  _addSwitch: function(prop) {

    var className = '.' + prop;

    var sw = new cdb.forms.Switch({
      model: this.mapOptions,
      property: prop
    })
    .bind("switched", this._onSwitchSwitched, this);

    this._renderSwitch(sw, className);

    if (!this.mapOptions.attributes[prop]) {
      this.$(className);
    }

  },

  _renderSwitch: function(sw, className) {

    this.addView(sw);
    this.$("li" + className).append(sw.render().el);

  },

  _onSwitchSwitched: function(property, value) {

    if (property === 'scrollwheel') {

      value ? this.options.vis.map.enableScrollWheel() : this.options.vis.map.disableScrollWheel();

      this.options.vis.map.save();
      this.options.table.globalError.showError("Scrollwheel " + (value ? 'enabled' : 'disabled'), 'info', 3000);

    } else if (property == "zoom") {

      this._toggleOverlay(property);

      var zoomInfo = this.collection.filter(function(m) { return m.get("type") == "zoom_info" })[0];

      var display  = this.mapOptions.get(property);

      zoomInfo.set({ display: display });
      zoomInfo.save();

    } else if (property === 'search' || property === 'fullscreen' || property === 'share' || property === 'layer_selector' || property === 'logo') {

      this._toggleOverlay(property);

    } else if (property == 'title') {

      var overlay          = this.collection.filter(function(m) { return m.get("type") == "header" })[0]
      var show_title       = this.mapOptions.get("title");

      overlay.set({ show_title: show_title });
      overlay.save();

    } else if (property == 'description') {

      var overlay          = this.collection.filter(function(m) { return m.get("type") == "header" })[0]
      var show_description = this.mapOptions.get("description");

      overlay.set({ show_description: show_description });
      overlay.save();

    }

    value ? this.$("li." + property).removeClass("disabled") : this.$("li." + property);

  },

  _toggleOverlay: function(property) {

    var overlay  = this.collection.filter(function(m) { return m.get("type") == property })[0];

    overlay.set({ display: this.mapOptions.get(property) });

    overlay.save();

  },

  /*
   * Renders the dropdown
   */
  render: function() {

    this.clearSubViews();

    this.$el.html(this.template_base(this.options));

    this._addSwitches(['title', 'description', 'search', 'zoom', 'fullscreen', 'share', 'scrollwheel', 'layer_selector', 'logo']);

    return this;

  }
});
