  
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

      // Restore fields
      this.model.restoreFields();

      // Send trigger
      this.trigger('reset', this);

      // Remove custom template
      this.model.set({ template: "" });
    },

    _toggleContent: function() {
      if (this.model.get("template")) {
        this.$el.find(".blocked").show();
      } else {
        this.$el.find(".blocked").hide();
      }
    }

  });