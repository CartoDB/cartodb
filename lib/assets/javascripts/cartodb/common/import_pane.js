/**
 * Create the views for the import panes
 *
 * usage example:
 *
 *    var filePane = new cdb.ui.common.ImportSourcePane({
 *        template: cdb.templates.getTemplate('common/views/import_file')
 *    });
 *
*/

cdb.admin.ImportPane = cdb.core.View.extend({

  default_options: {
    template: ''
  },

  initialize: function() {
    _.defaults(this.options, this.default_options);

    this.template = this.options.template;
    this.render();
  },

  render: function() {
    this.$el.append(this.template());
    return this;
  },
});
