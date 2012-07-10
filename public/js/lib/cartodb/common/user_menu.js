

	cdb.admin.UserMenu = cdb.ui.common.Dropdown.extend({
		open: function(ev) {
			this.isOpen = true;

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
	    });

	    // Add selected class to the target
	    $(this.options.target).addClass("selected");
	  
	    // Show
	    this.$el.animate({
	      margin: "0px 0 0 0",
	      opacity: 1
	    },this.options.speedIn);
		},

		hide: function() {
	    var self = this;
	    this.isOpen = false;

	    this.$el.animate({
	      margin: "-10px 0 0 0",
	      opacity: 0
	    },this.options.speedOut, function(){
	      // Remove selected class
	      $(self.options.target).removeClass("selected");
	      // And hide it
	      self.$el.hide();
	    });
  	}
	});