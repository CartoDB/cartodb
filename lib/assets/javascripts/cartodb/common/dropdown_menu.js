

  /**
   * User options dropdown (extends Dropdown)
   *
   * It shows the content in a dropdown (or dropup) with a special effect.
   *
   * Usage example:
   *
      var user_menu = new cdb.admin.DropdownMenu({
        target: $('a.account'),
        model: {username: username}, // No necessary indeed
        template_base: 'common/views/settings_item'
      });
   *
   */


  cdb.admin.DropdownMenu = cdb.ui.common.Dropdown.extend({

    show: function() {

      //sometimes this dialog is child of a node that is removed
      //for that reason we link again DOM events just in case
      this.delegateEvents();
      this.$el
        .css({
          margin: "-10px 0 0 0",
          opacity:0,
          display:"block"
        })
        .animate({
          margin: "0",
          opacity: 1
        },this.options.speedIn);
    },

    /**
     * open the dialog at x, y
     */
    openAt: function(x, y) {

      this.$el.css({
        top: y, 
        left: x,
        width: this.options.width,
        margin: "-10px 0 0 0",
        display: "block",
        opacity: 0
      })
      .addClass(
        (this.options.vertical_position == "up" ? "vertical_top" : "vertical_bottom" ) 
        + " " +
        (this.options.horizontal_position == "right" ? "horizontal_right" : "horizontal_left" )
      )

      this.isOpen = true;

      // Show
      this.show();
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
