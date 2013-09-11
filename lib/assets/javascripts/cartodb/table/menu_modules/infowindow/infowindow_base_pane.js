  
  /**
   *  Infowindow base pane view
   *  
   */

  cdb.admin.mod.InfowindowBasePane = cdb.core.View.extend({

    events: {
      "click .reset": "_onResetClick"
    },

    getColumnNames: function() {
      var self = this;
      var names = this.options.table.columnNames();
      return _(names).filter(function(c) {
        return !_.contains(self.model.SYSTEM_COLUMNS, c);
      });
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
        this.$(".blocked").show();
      } else {
        this.$(".blocked").hide();
      }
    }

  });