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
  initialize: function() {
    this.template = this.options.template;
    this.render();
  },

  render: function() {
    this.$el.append(this.template({app_api_key: this.options.app_api_key}));
    return this;
  }
});

cdb.admin.ImportFilePane = cdb.admin.ImportPane.extend({
  initialize: function() {
    this.template = cdb.templates.getTemplate('common/views/import_file');
    this.render();
  },

  render: function() {
    this.$holder = this.$el.find("div.holder");

    this.$el.append(this.template());
    return this;
  }
});

cdb.admin.ImportDropboxPane = cdb.admin.ImportPane.extend({
  initialize: function() {
    this.dblink = "";

    this.template = cdb.templates.getTemplate('common/views/import_dropbox');
    this.render();

    this._initBindings();
  },

  _initBindings: function() {
    var that = this;

    $(this.$el).bind("DOMSubtreeModified", function() {
      document.getElementById("db-chooser").addEventListener("DbxChooserSuccess", function(e) {
        that.dblink = e.files[0].link;
      }, false);
    });
  },

  render: function() {
    this.$el.append(this.template({app_api_key: this.options.app_api_key}));

    return this;
  }
});
