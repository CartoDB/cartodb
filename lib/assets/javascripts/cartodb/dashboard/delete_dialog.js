
  /**
   * Delete confirmation window (extends Dialog)
   *
   * When you need to delete a table, it needs a confirmation
   *
   * Usage example:
   *
      var delete_dialog = new cdb.admin.DeleteDialog({
        clean_on_hide: true,
        title: "You are about to delete this table",
        content: "You will not be able to recover this information. We really recommend you <a href='#export' class='underline'>export the data</a> before deleting it.",
        ok_button_classes: "button grey",
        ok_title: "Delete this table",
        cancel_button_classes: "underline margin15",
        modal_type: "confirmation",
        model: this.model
      });
   *
   */

  cdb.admin.DeleteDialog = cdb.ui.common.Dialog.extend({
    
    render_content: function() {
      return "<p>" + this.options.content + "</p>"
    },

    ok: function(ev) {
      this.model.destroy();
    },

    hide: function() {
      var self = this;

      this.$el.find(".modal").animate({
        marginTop: "50px",
        opacity: 0
      },300, function() {
        if(self.options.clean_on_hide) {
          self.clean();
        }
      });
      this.$el.find(".mamufas").fadeOut(300);
    },

    open: function() {
      var self = this;

      this.$el.find(".modal").css({
        "opacity": "0",
        "marginTop": "150px"
      });

      this.$el.find(".mamufas").fadeIn();
      this.$el.find(".modal").animate({
        marginTop: "100px",
        opacity: 1
      },300);
    }
  })