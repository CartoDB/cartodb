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

// <<<<<<< HEAD
cdb.admin.ImportPane = cdb.core.View.extend({
  className: "import-pane",
// =======
// cdb.admin.BaseMapChooserPane = cdb.core.View.extend({
//   initialize: function() {
//     this.template = this.options.template;
//     this.render();
//   },
// >>>>>>> 75b75e2bf8ffda61ae448503a261c3a1f36a05e3

  render: function() {
    this.$el.append(this.template({chosen: this.options.chosen}));
    return this;
  }
});
