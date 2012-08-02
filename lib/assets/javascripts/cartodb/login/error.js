/**
 * INPUT ERROR FOR THE MASSES
 *
 * Simulates a placeholder for a text input
 *
 * usage example:
 *
 *    var error = new cdb.admin.InputError({
 *        el: "div.error",
 *        speedIn: 200,
 *        speedOut: 200
 *    });
 *    // Remove it
 *    error.clear();
*/


cdb.admin.InputError = cdb.core.View.extend({

  tagName: 'div',
  className: 'error',

  events: {
    'mouseover a' : '_onMouseOver',
    'mouseout a'  : '_onMouseOut',
    'click a'     : '_onClick'
  },

  default_options: {
    speedIn: 200,
    speedOut: 200
  },

  initialize: function() {
    // Set options
    _.defaults(this.options, this.default_options);

    // Render
    this.render();

    // Show error
    this.$el.show();
  },


  render: function() {
    // Get error text
    var text = this.$el.text();

    // Create the error tooltip
    this.$p = $("<p>").text(text).append("<span>").addClass("tail");
    this.$a = $("<a>").addClass("error").attr("tabindex","-1");

    // Add the tooltip to the view
    this.$el
      .html('')
      .append(this.$a)
      .append(this.$p);

    return this;
  },


  clear: function() {
    // Remove error and bindings
    this.$a.unbind("click")
    this.$a.unbind("mouseover")
    this.$a.unbind("mouseout")

    this.remove();
  },


  _onClick: function(ev) {
    ev.preventDefault();
  },


  _onMouseOver: function(ev) {
    var height_ = this.$p.outerHeight()
      , options = this.options;

    // Show it
    this.$p.css({
      opacity:0,
      display:'inline-block',
      top: '-' + (height_ + 10 ) + 'px'
    }).show();

    if ($.browser.msie && $.browser.version<9) {
      this.$p.css({
        top: '-=5px',
        opacity: 1,
        display: 'block'
      });
    } else {
      this.$p.animate({
        top: '-=5px',
        opacity: 1
      },options.speedIn);
    }
  },

  _onMouseOut: function(ev) {
    var options = this.options;

    // Hide it
    if ($.browser.msie && $.browser.version<9) {
      this.$p.css({
        top: '+=5px',
        opacity: 0,
        display: 'none'
      });
    } else {
      this.$p.animate({
        top: '+=5px',
        opacity: 0
      },options.speedOut,function(ev){
        $(this).hide();
      });
    }
  }
});
