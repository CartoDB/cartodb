  
  /**
   *  Infowindow base pane view
   *  
   */

  cdb.admin.mod.InfowindowBasePane = cdb.core.View.extend({

    events: {
      "click .reset": "_onResetClick"
    },

    _onResetClick: function(e) {
      this.killEvent(e);
      this.model.set("custom_html", "");
    },

    _toggleContent: function() {
      if (this.model.get("custom_html")) {
        this.$el.find(".content").hide();
        this.$el.find(".blocked").show();
      } else {
        this.$el.find(".content").show();
        this.$el.find(".blocked").hide();
      }
    }

  });