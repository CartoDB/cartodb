
  cdb.admin.keys = cdb.admin.keys || {};

  /**
   * Get a new api keys dialog
   *
   * This window is an extend of the generic dialog for requesting
   * a new api key or new oauth credentials
   */

  cdb.admin.keys.RegenerateDialog = cdb.ui.common.Dialog.extend({
    
    render_content: function() {
      return "<p>" + this.options.content + "</p>"
    },

    ok: function(ev) {
      $("#" + this.options.send_form_id).submit();
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
        "marginTop": "170px"
      });

      this.$el.find(".mamufas").fadeIn();
      this.$el.find(".modal").animate({
        marginTop: "120px",
        opacity: 1
      },300);
    }
  })
