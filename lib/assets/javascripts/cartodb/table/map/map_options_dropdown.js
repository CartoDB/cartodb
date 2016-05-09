cdb.admin.MapOptionsDropdown = cdb.ui.common.Dropdown.extend({

  className: 'dropdown map_options_dropdown',

  defaults: {
    speedOut: 90,
    speedIn:  90
  },

  events: {
    "click" : "killEvent"
  },

  desktopOverlays: ["shareable", "zoom"],

  initialize: function() {

    _.bindAll(this, "open", "hide", "_handleClick", "_keydown");

    // Extend options
    _.defaults(this.options, this.defaults);

    this.collection.on("reset", this._setupOptions, this);
    this.collection.on("change:description", this._setupOptions, this);

    this.disabledCartodbLogo = this.options.user.featureEnabled("disabled_cartodb_logo");

    this.mapOptions = new cdb.core.Model({
      title:            false,
      description:      false,
      search:           false,
      layer_selector:   false,
      fullscreen:       false,
      share:            false,
      logo:             this.disabledCartodbLogo,
      zoom:             true,
      scrollwheel:      false,
      legends:          true
    });

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    this.options.canvas.bind("change:mode", this._onChangeDevice, this);
    this.mapOptions.bind("change", this._onMapOptionsChange, this);

    // Bind to target
    $(this.options.target).bind({ "click": this._handleClick});
    $(this.options.target).bind({ "dblclick": this.killEvent});

    // Bind ESC key
    $(document).bind('keydown', this._keydown);

    // Is open flag
    this.isOpen = false;

    this._setupOptions();

  },

  _onMapOptionsChange: function(model, changes) {

    _.each(changes.changes, function(value, option) {

      var $el = this.$el.find("li." + option);

      if ($el.find("a").hasClass("enabled")) $el.addClass("active");
      else $el.removeClass("active");

    }, this);

  },

  _enableDesktopOverlays: function() {

    _.each(this.desktopOverlays, function(overlay) {

      var $overlay = this.$el.find("." + overlay);

      $overlay.removeClass("inactive");
      $overlay.find(".form_switch").removeClass("inactive");

    }, this);

  },

  _disableDesktopOverlays: function() {

    _.each(this.desktopOverlays, function(overlay) {

      var $overlay = this.$el.find("." + overlay);

      $overlay.addClass("inactive");
      $overlay.find(".form_switch").addClass("inactive");

    }, this);

  },

  _onChangeDevice: function() {

    var device = this.options.canvas.get("mode");

    if (device === 'mobile') {

      this._disableDesktopOverlays();

    } else {

      this._enableDesktopOverlays();

    }

  },

  _setupOptions: function() {
    var self = this;
    var overlays = this.collection.models;
    var simpleOverlays = ["search", "shareable", "zoom", "fullscreen", "layer_selector", "logo"];

    // If user has set the diable cartodb logo FF then remove the logo
    if(this.disabledCartodbLogo) {
      simpleOverlays.pop();
    }

    this.mapOptions.set({ scrollwheel: !!this.options.vis.map.get("scrollwheel") });
    this.mapOptions.set({ legends: !!this.options.vis.map.get("legends") });

    _.each(simpleOverlays, function(overlay_type) {
      if (!_.contains(self.collection.pluck("type"), overlay_type)) {
        self.mapOptions.set(overlay_type, false);
      }
    })

    _.each(overlays, function(overlay) {

      var extra = overlay.get("extra");
      var type  = overlay.get("type");

      if (type === "header") {

        var show_title       = extra.show_title;
        var show_description = extra.show_description;

        self.mapOptions.set({ title: show_title, description: show_description });

        if (show_title) {
          self.$(".title").removeClass("disabled");
        }

        if (show_description) {
          self.$(".description").removeClass("disabled");
        } else {
          self.$(".description").addClass("disabled");
        }

      } else if (_.contains(simpleOverlays, type)) {

        var display = overlay.get("display");
        self.mapOptions.set(type, display);

        if (display) {
          self.$("." + type).removeClass("disabled");
        }

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

    } else if (property === 'legends') {

      this.options.vis.map.set(property, value)

      this.options.vis.map.save();

      if (value) {
        table.mapTab._addLegends();
      } else {
        table.mapTab._cleanLegends();
      }

      this.options.table.globalError.showError("Legends " + (value ? 'enabled' : 'disabled'), 'info', 3000);

    } else if (property === "zoom" || property === 'search' || property === 'fullscreen' || property === 'share' || property === 'layer_selector' || property === 'logo') {

      this._toggleOverlay(property);

    } else if (property === 'title' || property === 'description') {

      var overlay = this.collection.filter(function(m) { return m.get("type") == "header" })[0]

      if (!overlay) {

        this.trigger("createOverlay", "header", property);
        return;

      }

      var show_property = this.mapOptions.get(property);

      overlay.set("show_" + property, show_property);
      overlay.save();

      if ( (!overlay.get("show_title") && !overlay.get("show_description") ) || !overlay.get("show_title") && !overlay.get("description")) this.options.collection.remove(overlay);

    }

    value ? this.$("li." + property).removeClass("disabled") : this.$("li." + property);

  },

  _toggleOverlay: function(property) {

    var overlay  = this.collection.filter(function(m) { return m.get("type") === property; })[0];

    if (overlay) {

      this.options.collection.remove(overlay);

    } else if (!overlay) {

      this.trigger("createOverlay", property);

    }

  },

  /*
   * Renders the dropdown
   */
  render: function() {

    var switches = ['title', 'description', 'search', 'zoom', 'fullscreen', 'scrollwheel', 'layer_selector', 'legends'];

    this.clearSubViews();
    this.$el.html(this.template_base(this.options));

    // Show the logo switch if user is allowed and disabled_cartodb_logo FF is not set
    if (this.options.user.get('actions').remove_logo && !this.disabledCartodbLogo) {
      switches.push('logo');
    } else {
      this.$('.logo').remove();
    }

    this._addSwitches(switches);

    _.each(this.mapOptions.attributes, function(value, option) {

      var $el = this.$el.find("li." + option);

      if ($el.find("a").hasClass("enabled")) $el.addClass("active");
      else $el.removeClass("active");

    }, this);

    return this;

  },

  clean: function() {
    $(document).unbind('keydown', this._keydown);
    cdb.ui.common.Dropdown.prototype.clean.call(this);
  }
});
