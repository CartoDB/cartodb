
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
      this._loadDropbox();
      this.template = this.options.template || cdb.templates.getTemplate('common/views/import_dropbox');
      this.render();
    },

    _loadDropbox: function() {
      var api_key = cdb.config.get('dropbox_api_key');
      if (typeof(window['Dropbox']) !== 'undefined') {
        delete window.Dropbox;
      }
      window.Dropbox = {};
      window.Dropbox.appKey = api_key;
      var script = document.createElement('script');
      script.setAttribute('id', 'dropboxjs');
      script.setAttribute('data-app-key', api_key);
      script.src = '//www.dropbox.com/static/api/1/dropins.js';
      $('head').append(script);
    },

    render: function() {
      var extensions_list = '';
      if (this.options.acceptFileTypes) {
        extensions_list = "." + this.options.acceptFileTypes.join(' .');
      }
      this.$el.html(this.template({ extensions: extensions_list }));
      return this;
    },

    _onDbxChooserSuccess: function(e) {
      var self = this;
      this.killEvent(e);
      if (e.originalEvent.files && e.originalEvent.files[0]) {
        debugger;
        self.trigger('fileChosen', 'dropbox', e.originalEvent.files[0].link);
      }
    }
  });

