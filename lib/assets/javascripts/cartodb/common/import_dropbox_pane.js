
  /**
   *  Dropbox pane for import a file
   *
   *  - It needs a CartoDB api key to work.
   *  - It could add a list with the valid extensions files accepted (acceptFileTypes).
   *  - 
   */


  cdb.admin.ImportDropboxPane = cdb.admin.ImportPane.extend({
    
    className: "import-pane import-pane-dropbox",

    events: {
      'DbxChooserSuccess #db-chooser' : '_onDbxChooserSuccess'
    },

    initialize: function() {
      this.template = this.options.template || cdb.templates.getTemplate('common/views/import_dropbox');
      this.render();
    },

    render: function() {
      var api_key = cdb.config.get('dropbox_api_key');
      var extensions_list = '';
      if (this.options.acceptFileTypes) {
        extensions_list = "." + this.options.acceptFileTypes.join(' .');
      }
      this.$el.html(this.template({ app_api_key: api_key, extensions: extensions_list }));
      return this;
    },

    _onDbxChooserSuccess: function(e) {
      var self = this;
      this.killEvent(e);
      if (e.originalEvent.files && e.originalEvent.files[0]) {
        self.trigger('fileChosen', 'dropbox', e.originalEvent.files[0].link);
      }
    }
  });
