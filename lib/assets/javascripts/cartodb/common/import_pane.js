/**
 * Create the views for the import panes
 *
 * usage example:
 *
 *  var filePane = new cdb.ui.common.ImportSourcePane({
 *    template: cdb.templates.getTemplate('common/views/import_file')
 *  });
 *
*/

cdb.admin.ImportPane = cdb.core.View.extend({
  className: "import-pane",

  render: function() {
    this.$el.append(this.template({app_api_key: this.options.app_api_key}));
    return this;
  }
});