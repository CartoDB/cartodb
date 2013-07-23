cdb.admin.ImportDropboxPane = cdb.admin.ImportPane.extend({
  className: "import-pane import-pane-dropbox",

  events: {
    'click .dropbox-chooser' : '_onClickDBButton'
  },

  initialize: function() {
    this.dblink = "";

    this.template = cdb.templates.getTemplate('common/views/import_dropbox');
    this.render();
  },

  _onClickDBButton: function(e) {
    var self = this;

    e.preventDefault();
    e.stopPropagation();

    Dropbox.choose({
      // "preview" or "direct"
      linkType: "direct",
      multiselect: false,
      // Required. Called when a user selects an item in the Chooser.
      success: function(files) {
        var link = files[0].link;

        self.dblink = link;
        alert("Here's the file link: " + link)
      }
    });
  },

  render: function() {
    this.$el.append(this.template({app_api_key: this.options.app_api_key}));

    return this;
  }
});
