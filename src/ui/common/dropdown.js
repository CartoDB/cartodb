/**
 * Show a dropdown from the target
 *
 * It shows the several options of the user settings
 *
 * usage example:
 *
 *    var settings = new cdb.ui.common.Dropdown({
 *        el: "#settings_element",
 *        speedIn: 300,
 *        speedOut: 200
 *    });
 *    // show it
 *    settings.show();
 *    // close it
 *    settings.close();
*/

cdb.ui.common.Dropdown = cdb.core.View.extend({

  tagName: 'div',
  className: 'dropdown',

  events: {
    "click ul li a" : "_fireClick"
  },

  default_options: {
    width: 160,
    speedIn: 150,
    speedOut: 300,
    vertical_position: "down",
    horizontal_position: "right",
    tick: "right",
    vertical_offset: 0,
    horizontal_offset: 0
  },

  initialize: function() {
    _.bindAll(this, "open", "hide", "_handleClick", "_keydown");

    // Extend options
    _.defaults(this.options, this.default_options);

    // Dropdown template
    if (this.options.template_base) {
      this.template_base = cdb.templates.getTemplate(this.options.template_base);
    } else if (this.options.template) {
      this.template_base = this.options.template;
    }

    // Bind to target
    $(this.options.target).bind({"click": this._handleClick});

    // Bind ESC key
    $(document).bind('keydown', this._keydown);

    // Is open flag
    this.isOpen = false;

  },

  render: function() {
    // Render
    var $el = this.$el;
    $el
      .html(this.template_base(this.options))
      .css({
        width: this.options.width
      })
    return this;
  },

  _handleClick: function(ev) {
    //Check if the dropdown is visible to hiding with the click on the target
    if (ev){
      ev.preventDefault();
      ev.stopPropagation();
    }
    // If visible
    if (this.isOpen){
      this.hide();
    }else{
      this.open();
    }
  },

  _keydown: function(e) {
    if (e.keyCode === 27) {
      this.hide();
    }
  },

  hide: function() {
    this.isOpen = false;
    this.$el.hide();
  },

  show: function() {
    this.$el.css({
      display: "block",
      opacity: 1
    });
    this.isOpen = true;
  },

  open: function(ev,target) {
    // Target
    var $target = target && $(target) || this.options.target;
    this.options.target = $target;

    // Positionate
    var targetPos     = $target[this.options.position || 'offset']()
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
    )

    // Show it
    this.show();

    // Dropdown openned
    this.isOpen = true;
  },

  _fireClick: function(ev) {
    this.trigger("optionClicked", ev, this.el);
  }
});
