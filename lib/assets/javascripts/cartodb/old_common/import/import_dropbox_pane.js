
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
      button: {
        idle:     _t('Choose from Dropbox'),
        selected: _t('Change in Dropbox')
      },
      fileError: 'You have to choose a valid Dropbox file.'
    },
    
    className: "import-pane import-pane-dropbox",

    events: {
      'click #dropbox-chooser': '_onDropboxClick'
    },

    initialize: function() {
      cdb.admin.ImportPane.prototype.initialize.call(this);

      _.bindAll(this, '_onDbxChooserSuccess');
      
      this.template = this.options.template || cdb.templates.getTemplate('old_common/views/import/import_dropbox');
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

    _setFilename: function(name) {
      this.$('p.filename').text(name);
      this.$('p.info').hide();
      this.$('.dropbox-dropin-btn').html('<span class="dropin-btn-status"></span>' + this._TEXTS.button.selected);
    },

    _onValueChange: function() {
      // Any value change, trigger event
      this.trigger('valueChange', this.model.toJSON());
      // If value is selected change the class
      // of the view
      this.$el[ this.model.get('value') ? 'addClass' : 'removeClass' ]('value-selected')
    },

    submitUpload: function() {
      if (this.model.get('value')) {
        this.trigger('fileChosen', this.model.toJSON());
      } else {
        this.import_info.activeTab('error', this._TEXTS.fileError);
      }
    },

    _onDropboxClick: function(e) {
      if (e) e.preventDefault();

      Dropbox.choose({
        success:      this._onDbxChooserSuccess,
        multiselect:  false,
        linkType:     "direct",
        extensions:   _.map(this.options.acceptFileTypes, function(ext) { return '.' + ext })
      });
    },

    _onDbxChooserSuccess: function(files) {
      if (files && files[0]) {
        this._setFilename(files[0].name || files[0].link);
        this.model.set({
          type: 'url',
          value: files[0].link
        });
      }
    }
  });