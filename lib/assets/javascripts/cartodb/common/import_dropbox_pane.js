
  /**
   *  Dropbox pane for import a file
   */


  cdb.admin.ImportDropboxPane = cdb.admin.ImportPane.extend({
    
    className: "import-pane import-pane-dropbox",

    events: {
      'click .dropbox-chooser' : '_onClickDBButton'
    },

    initialize: function() {
      this.template = this.options.template || cdb.templates.getTemplate('common/views/import_dropbox');
      this.render();
    },

    _onClickDBButton: function(e) {
      var self = this;

      this.killEvent(e);

      Dropbox.choose({
        linkType: "direct",
        multiselect: false,
        success: function(files) {
          var link = files[0].link;
          self.trigger('fileChosen', 'url', link);
        }
      });
    },

    render: function() {
      this.$el.html(this.template({ app_api_key: this.options.app_api_key }));
      return this;
    }
  });
