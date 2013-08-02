/**
 * Create the views for the basemap chooser panes
 *
 * usage example:
 *
 * this.mapboxPane = new cdb.admin.BaseMapChooserPane({
 *   template: cdb.templates.getTemplate('table/views/basemap_chooser')
 * });
 * this.addView(this.mapboxPane);
 *
*/

cdb.admin.ImportPane = cdb.core.View.extend({
  className: "import-pane",

  render: function() {
    this.$el.append(this.template({chosen: this.options.chosen}));
    return this;
  }
});
