cdb.admin.OverlayPropertiesDropdown = cdb.ui.common.Dropdown.extend({

  className: 'dropdown properties_dropdown',

  defaults: {
    speedOut: 100,
    speedIn: 100
  },

  events: {
    "click" : "killEvent",
    "dblclick" : "killEvent"
  },

  initialize: function() {

    _.bindAll(this, "open", "hide", "_handleClick", "_onKeyDown");

    // Extend options
    _.defaults(this.options, this.defaults);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Bind to target
    $(this.options.target).bind({ "click": this._handleClick});

    this._addStyleModel();

    // Bind ESC key
    $(document).bind('keydown', this._onKeyDown);

    // Is open flag
    this.isOpen = false;

    this.options.original_vertical_position =  this.options.vertical_position;

  },

  /* Check if the dropdown is visible to hiding with the click on the target */
  _handleClick: function(ev) {
    if (ev) {
      ev.preventDefault();
    }

    // If visible
    if (this.isOpen){
      this.hide();
    } else{
      this.open();
    }
  },

  /* Defines model for the popup form */

  _addStyleModel: function() {

    this.style = new cdb.core.Model(this.model.get("style"));

    /* Everytime the style changes, store it back in the main model */
    this.style.bind("change", function() {
      this.model.set("style", this.style.toJSON());
    }, this);

  },

  _adjustPosition:function() {

    var top        = this.$el.offset().top;
    var left       = this.$el.offset().left;
    var width      = this.$el.width();
    var height     = this.$el.height();

    var $map = $(".cartodb-map");

    var map_width       = $map.width();
    var map_height      = $map.height();
    var map_top_offset  = $map.offset().top;
    var map_left_offset = $map.offset().left;

    // Move tick to the other side if the dropdown is closed to the right border
    if ((left + width - map_left_offset) > map_width) {

      this.$el
      .css({ left: "auto", right: -6 })
      .removeClass("tick_left")
      .addClass("tick_right");

    }

    if (top + height - map_top_offset > map_height) {

      this.$el.css({ top: -height - 13 });

    }

  },

  show: function() {

    var self = this;

    var dfd = $.Deferred();

    // Target
    var $target = this.options.target;

    this.options.target = $target;

    var topPosition  = this.options.target.position().top;
    var leftPosition = this.options.target.position().left;

    if (this.options.offset_mode === "offset") {
      topPosition  = this.options.target.offset().top;
      leftPosition = this.options.target.offset().left;
    }

    var top  = topPosition  + this.options.vertical_offset;
    var left = leftPosition + this.options.horizontal_offset;

    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();
    this.$el
    .css({
      top:  top,
      left: left,
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

    if (this.options.offset_mode !== "offset") {
      this._adjustPosition();
    }

    this.trigger("onDropdownShown", this.el);

    return dfd.promise();
  },

  move: function(animated) {
    var dfd = $.Deferred();
    var self = this;

    // Target
    var $target = this.options.target;

    this.options.target = $target;

    var topPosition  = this.options.target.position().top;
    var leftPosition = this.options.target.position().left;

    if (this.options.offset_mode === "offset") {
      topPosition  = this.options.target.offset().top;
      leftPosition = this.options.target.offset().left;
    }

    var top  = topPosition  + this.options.vertical_offset;
    var left = leftPosition + this.options.horizontal_offset;


    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case

    this.delegateEvents();

    if (animated) {

      this.$el
      .css({ marginTop: 0, display:"block" })
      .animate({ top:  top, left: left
      }, {
        "duration": this.options.speedIn,
        "complete": function(){ dfd.resolve();
        } 
      });

    } else {

      this.$el
      .css({
        top: top, left: left, marginTop: 0, display:"block" })
        .animate({}, {
          "duration": this.options.speedIn,
          "complete": function(){ dfd.resolve();
          } 
        });
    }

    if (this.options.offset_mode !== "offset") {
      this._adjustPosition();
    }

    this.trigger("onDropdownShown", this.el);

    return dfd.promise();

  },

  open: function(ev, target) {

    var $target = target && $(target) || this.options.target;

    this.options.target = $target;

    this.$el.removeClass("vertical_top");
    this.$el.removeClass("vertical_bottom");

    if (this.options.offset_mode !== "offset") {
      var t = this.options.target.offset().top + this.options.vertical_offset + this.$el.height() - $(".cartodb-map").offset().top > $(".cartodb-map").height();
    }

    if (t) {
      this.options.vertical_position = "up";
    } else {
      this.options.vertical_position = this.options.original_vertical_position;
    }

    this.$el.css({
      top:  this.options.target.offset().top    + this.options.vertical_offset,
      left: this.options.target.position().left + this.options.horizontal_offset
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

  _addForm: function() {

    var properties = this.options.properties;

    var self = this;

    this.form = new cdb.forms.Form({
      form_data: this.options.form_data,
      model: this.style
    }).on("saved", function() {
      self.trigger("saved", self)
    });

    this.addView(this.form);
    this.$el.append(this.form.render().$el);

  },

  /*
   * Renders the dropdown
   */
  render: function() {

    this.clearSubViews();

    this.$el.html(this.template_base(this.options));

    this._addForm();

    return this;
  }
});
