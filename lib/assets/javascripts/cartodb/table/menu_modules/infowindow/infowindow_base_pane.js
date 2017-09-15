  
  /**
   *  Infowindow base pane view
   *  
   */

  cdb.admin.mod.InfowindowBasePane = cdb.core.View.extend({

    _DEFAULT_TEMPLATE: 'infowindow_light',

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

      // Restore template_name if exists, reset old_template_name and reset template
      this.model.set({ 
        template_name:      this.model.get('old_template_name') || this._DEFAULT_TEMPLATE,
        old_template_name:  '',
        template:           ''
      });

      // Restore fields
      this.model.restoreFields();

      // Send trigger
      this.trigger('reset', this);

    },

    _toggleContent: function() {
      if (this.model.get("template")) {
        this.$el.addClass('disabled');
        this.$(".blocked").show();
      } else {
        this.$el.removeClass('disabled');
        this.$(".blocked").hide();
      }
    }

  });