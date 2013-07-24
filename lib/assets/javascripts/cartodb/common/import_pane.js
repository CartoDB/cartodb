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

cdb.admin.BaseMapChooserPane = cdb.core.View.extend({
  initialize: function() {
    this.template = this.options.template;
    this.render();
  },

  render: function() {
    this.$el.append(this.template({chosen: this.options.chosen}));
    return this;
  }
});
