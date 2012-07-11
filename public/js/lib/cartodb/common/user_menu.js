

cdb.admin.UserMenu = cdb.ui.common.Dropdown.extend({
  open: function(ev, target) {
    this.isOpen = true;

    target = target || this.options.target;
    this.options.target = target;

    // Positionate
    var targetPos = $(target)[this.options.position || 'offset']()
      , targetWidth = $(target).outerWidth()
      , targetHeight = $(target).outerHeight()

    this.$el.css({
      top: targetPos.top + targetHeight + 10,
      left: targetPos.left + targetWidth - this.options.width + 15,
      width: this.options.width,
      margin: "-10px 0 0 0",
      display: "block",
      opacity: 0
    });

    // Add selected class to the target
    $(target).addClass("selected");

    // Show
    this.$el.animate({
      margin: "0px 0 0 0",
      opacity: 1
    },this.options.speedIn);
  },

  hide: function(done) {
    var self = this;
    this.isOpen = false;

    this.$el.animate({
      margin: "10px 0 0 0",
      opacity: 0
    },this.options.speedOut, function(){
      // Remove selected class
      $(self.options.target).removeClass("selected");
      // And hide it
      self.$el.hide();
      done && done();
    });
  }
});
