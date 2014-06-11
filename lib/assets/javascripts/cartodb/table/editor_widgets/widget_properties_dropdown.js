cdb.admin.WidgetPropertiesDropdown = cdb.ui.common.Dropdown.extend({

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

  move: function() {
    var dfd = $.Deferred();
    var self = this;

    // Target
    var $target = this.options.target;

    this.options.target = $target;

    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();
    this.$el
    .css({
      top:  this.options.target.position().top  + this.options.vertical_offset,
      left: this.options.target.position().left + this.options.horizontal_offset,
      marginTop: 0,
      display:"block"
    })
    .animate({
    }, {
      "duration": this.options.speedIn,
      "complete": function(){
        dfd.resolve();
      }
    });

    // Move tick to the other side if the dropdown is closed to the right border
    if (this.$el.offset().left + this.$el.width() - $(".cartodb-map").offset().left > $(".cartodb-map").width()) {

      this.$el.removeClass("tick_left");
      this.$el.addClass("tick_right");

      this.$el.css({ left: -6 });

    }

    if (this.options.target.offset().top + this.options.vertical_offset + this.$el.height() - $(".cartodb-map").offset().top > $(".cartodb-map").height()) {

      this.$el.css({ top: -this.$el.height() - 13 });

    }

    this.trigger("onDropdownShown", this.el);

    return dfd.promise();
  },

  show: function() {

    var dfd = $.Deferred();
    var self = this;

    // Target
    var $target = this.options.target;

    this.options.target = $target;

    //sometimes this dialog is child of a node that is removed
    //for that reason we link again DOM events just in case
    this.delegateEvents();
    this.$el
    .css({
      top:  this.options.target.position().top  + this.options.vertical_offset,
      left: this.options.target.position().left + this.options.horizontal_offset,
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

    // Move tick to the other side if the dropdown is closed to the right border
    if (this.$el.offset().left + this.$el.width() - $(".cartodb-map").offset().left > $(".cartodb-map").width()) {

      this.$el.removeClass("tick_left");
      this.$el.addClass("tick_right");

      this.$el.css({ left: -6 });

    }

    if (this.options.target.offset().top + this.options.vertical_offset + this.$el.height() - $(".cartodb-map").offset().top > $(".cartodb-map").height()) {

      this.$el.css({ top: -this.$el.height() - 13 });

    }

    this.trigger("onDropdownShown", this.el);

    return dfd.promise();
  },

  open: function(ev, target) {

    // Target
    var $target = target && $(target) || this.options.target;

    this.options.target = $target;

    console.log(this.options.original_vertical_position)

    this.$el.removeClass("vertical_top");
    this.$el.removeClass("vertical_bottom");

    var t = this.options.target.offset().top    + this.options.vertical_offset + this.$el.height() - $(".cartodb-map").offset().top > $(".cartodb-map").height();

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
