/**
 * Show the user settings urls
 *
 * It shows the several options of the user settings 
 *
 * usage example:
 *
 *    var settings = new cdb.ui.common.Dropdown({
 *        el: "#settings_element",
 *        speed: 300
 *    });
 *    // show it
 *    settings.show();
 *    // close it
 *    settings.close();
*/

cdb.admin.Dropdown = cdb.core.View.extend({

  tagName: 'div',
  className: 'dropdown',

  events: {
    "click ul>li>a" : "_fireClick"
  },

  default_options: {
      width: 160,
      speedIn: 200,
      speedOut: 200
  },

  initialize: function() {
    _.bindAll(this,"open", "hide");

    // Extend options
    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Bind to target
    $(this.options.target).bind({"click": this.open})
  },

  render: function() {
    // Render
    var $el = this.$el;
    $el.html(this.template_base());
    return this;
  },

  hide: function() {
    var self = this;
    this.$el.animate({
      margin: "-15px 0 0 0",
      opacity: 0
    },this.options.speedOut,function(){
      // Remove selected class
      $(self.options.target).removeClass("selected");
      // And hide it
      self.$el.hide();
    });
  },

  open: function(ev) {
    // If visible
    if (this.$el.is(":visible")) return false;

    if (ev) {
      // Stop default
      ev.preventDefault();
      ev.stopPropagation();
      
      // Positionate
      var targetPos = $(this.options.target).offset()
        , targetWidth = $(this.options.target).outerWidth()
        , targetHeight = $(this.options.target).outerHeight()

      this.$el.css({
        top: targetPos.top + targetHeight + 10,
        left: targetPos.left + targetWidth - this.options.width + 15,
        width: this.options.width,
        margin: "-15px 0 0 0",
        display: "block",
        opacity: 0
      })
    }

    // Add selected class to the target
    $(this.options.target).addClass("selected");
  
    // Show
    this.$el.animate({
      margin: "0px 0 0 0",
      opacity: 1
    },this.options.speedIn);
  },

  _fireClick: function(ev) {
    this.trigger("optionClicked", ev, this.el);
  }

});
