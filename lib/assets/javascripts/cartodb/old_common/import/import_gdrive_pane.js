
  /**
   *  GDrive pane for upload files
   *  
   *  - Needs to load picker in the html view.
   *
   */

  cdb.admin.ImportGdrivePane = cdb.admin.ImportPane.extend({
    
    className: "import-pane import-pane-gdrive",

    events: {
      'click .gdrive-chooser' : '_onClickGDButton'
    },

    _UPLOADER: {
      acceptFileTypes: ['application/vnd.google-apps.spreadsheet']
    },

    initialize: function() {
      cdb.admin.ImportPane.prototype.initialize.call(this);
      _.bindAll(this, "_pickerCallback", "_driveApiLoaded", "_onPickerLoaded");
      
      this.template = this.options.template || cdb.templates.getTemplate('old_common/views/import/import_gdrive');

      this.model.set('enabled', false);

      this.model.bind('change:value',   this._onValueChange,    this);
      this.model.bind('change:enabled', this._onEnabledChange,  this);

      this.render();
      this._initImportInfo();
      this._setGDrive();
    },

    render: function() {
      this.$el.append(this.template());
      return this;
    },

    _initImportInfo: function() {
      // It will show errors, sync, user,... etc
      this.import_info = new cdb.admin.GDriveImportInfo({
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
      this.$('p.info').hide();
      this.$('.gdrive-chooser').text('Change selection');
    },

    _onValueChange: function() {
      // Any value change, trigger event
      this.trigger('valueChange', this.model.toJSON());
      // If value is selected change the class
      // of the view
      this.$el[ this.model.get('value') ? 'addClass' : 'removeClass' ]('value-selected')
    },

    _onEnabledChange: function() {
      this.$('.gdrive-chooser')
        [ this.model.get('enabled') ? 'removeClass' : 'addClass']('disabled');
    },

    submitUpload: function() {
      if (this.model.get('value')) {
        this.trigger('fileChosen', this.model.toJSON());
      } else {
        this.import_info.activeTab('error', this._TEXTS.fileError);
      }
    },

    _setGDrive: function() {
      gapi.client.setApiKey(cdb.config.get('gdrive_app_key'));
      gapi.client.load('drive', 'v2', this._driveApiLoaded);
      google.load('picker', '1', {
        callback: this._onPickerLoaded
      });
    },

    _onPickerLoaded: function() {
      this.model.set('enabled', true)
    },

    _driveApiLoaded: function() {
      this._doAuth(true);
    },

    _doAuth: function(immediate, callback) {
      gapi.auth.authorize({
        client_id: cdb.config.get('gdrive_app_id') + '.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        immediate: immediate
      }, callback);
    },

    _onClickGDButton: function(e) {
      if (e) this.killEvent(e);

      // Not loaded yet?
      if (!this.model.get('enabled')) return;

      // Check if the user has already authenticated
      var token = gapi.auth.getToken();
      if (token) {
        this._showPicker();
      } else {
        // The user has not yet authenticated with Google
        // We need to do the authentication before displaying the Drive picker.
        this._doAuth(false, function() {
          this._showPicker();
        }.bind(this));
      }
    },

    _showPicker: function(e) {
      this.killEvent(e);
      var self = this;

      var accessToken = gapi.auth.getToken().access_token;
      this.picker = new google.picker.PickerBuilder()
        .addView(new google.picker.View(google.picker.ViewId.DOCS))
        .setAppId(cdb.config.get('gdrive_app_id') + ".apps.googleusercontent.com")
        .setOAuthToken(accessToken)
        .setCallback(this._pickerCallback)
        .build()
        .setVisible(true);
    },

    _pickerCallback: function(data) {
      if (data.action == google.picker.Action.PICKED) {
        var url = data.docs[0].url + "&output=csv";
        var name = data.docs[0].name;

        this.model.set({
          type: 'url',
          value: url
        });

        this._setFilename(name);
      }
    }

  });
