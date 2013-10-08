
  /**
   *  Dropbox pane for import a file
   *
   *  - It needs a CartoDB api key to work.
   *  - It could add a list with the valid extensions files accepted (acceptFileTypes).
   *  - It should have acceptSync variable if user can sync public url files.
   *
   *  new cdb.admin.ImportDropboxPane()
   */


  cdb.admin.ImportDropboxPane = cdb.admin.ImportPane.extend({

    _TEXTS: {
      fileError: 'You have to choose a valid Dropbox file.'
    },
    
    className: "import-pane import-pane-dropbox",

    events: {
      'DbxChooserSuccess #db-chooser' : '_onDbxChooserSuccess'
    },

    initialize: function() {
      cdb.admin.ImportPane.prototype.initialize.call(this);
      this._loadDropbox();
      this.template = this.options.template || cdb.templates.getTemplate('common/views/import_dropbox');

      this.model.bind('change:value', this._onValueChange, this);

      this.render();
      this._initImportInfo();
    },

    render: function() {
      var extensions_list = '';
      if (this.options.acceptFileTypes) {
        extensions_list = "." + this.options.acceptFileTypes.join(' .');
      }
      this.$el.html(this.template({ extensions: extensions_list }));
      return this;
    },

    _initImportInfo: function() {
      // It will show errors, sync, user,... etc
      this.import_info = new cdb.admin.DropboxImportInfo({
        el:         this.$('div.infobox'),
        model:      this.model,
        acceptSync: this.options.acceptSync
      });

      // If click over upgrade link
      this.import_info.bind('showUpgrade', function() {
        this.trigger('showUpgrade');
      }, this);
      
      this.addView(this.import_info);
    },

    _setFilename: function(filename) {
      this.$('p.filename').text(filename);
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

    _onValueChange: function() {
      this.trigger('valueChange', this.model.toJSON()); // Any value change, trigger event
    },

    submitUpload: function() {
      if (this.model.get('value')) {
        this.trigger('fileChosen', this.model.toJSON());
      } else {
        this.import_info.activeTab('error', this._TEXTS.fileError);
      }
    },

    _onDbxChooserSuccess: function(e) {
      var self = this;
      this.killEvent(e);

      if (e.originalEvent.files && e.originalEvent.files[0]) {
        this.model.set({
          type: 'url',
          value: e.originalEvent.files[0].link
        });
        this._setFilename(e.originalEvent.files[0].name);
      }
    }
  });