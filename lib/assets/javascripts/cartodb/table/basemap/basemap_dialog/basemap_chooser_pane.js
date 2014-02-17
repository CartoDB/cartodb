
  /**
   *  View for the basemap chooser panes
   */

  cdb.admin.BasemapChooserPane = cdb.core.View.extend({
    className: "basemap-pane",

    render: function() {
      this.$el.append(this.template({
        placeholder: this.options.placeholder,
        type: this.options.type
      }));
      return this;
    }
  });
