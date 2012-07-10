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
      speedIn: 150,
      speedOut: 150
  },

  initialize: function() {
    _.bindAll(this,"open", "hide", "handle_click");

    // Extend options
    _.defaults(this.options, this.default_options);

    // Dropdown template
    this.template_base = cdb.templates.getTemplate(this.options.template_base);

    // Bind to target
    $(this.options.target).bind({"click": this.handle_click});

    // Is open flag
    this.isOpen = false;

  },

  render: function() {
    // Render
    var $el = this.$el;
    $el.html(this.template_base());
    return this;
  },

  handle_click: function(ev) {
    //Check if the dropdown is visible to hiding with the click on the target
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
    }
    // If visible
    if (this.isOpen){
      this.hide();
    }else{
      this.open();
    }
    this.isOpen = !this.isOpen;
  },

  hide: function() {
    var self = this;
    this.$el.animate({
      margin: "-10px 0 0 0",
      opacity: 0
    },this.options.speedOut, function(){
      // Remove selected class
      $(self.options.target).removeClass("selected");
      // And hide it
      self.$el.hide();
    });
  },

  open: function() {
      
    // Positionate
    var targetPos = $(this.options.target).offset()
      , targetWidth = $(this.options.target).outerWidth()
      , targetHeight = $(this.options.target).outerHeight()

    this.$el.css({
      top: targetPos.top + targetHeight + 10,
      left: targetPos.left + targetWidth - this.options.width + 15,
      width: this.options.width,
      margin: "-10px 0 0 0",
      display: "block",
      opacity: 0
    })

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
