
  /**
   *  GDrive pane for upload files
   *  
   *  - Needs to load picker in the html view.
   *    
   *    <script src="https://www.google.com/jsapi?key=AIzaSyDzeK_h4JhsU9-wtNaR3j0ZeeYBLtaPcEA"></script>
   *    google.load('picker', '1');
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
      _.bindAll(this, "_pickerCallback");
      
      this.template = this.options.template || cdb.templates.getTemplate('common/views/import_gdrive');
      this.model.bind('change:value', this._onValueChange, this);

      this.render();
      this._initImportInfo();
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

    submitUpload: function() {
      if (this.model.get('value')) {
        this.trigger('fileChosen', this.model.toJSON());
      } else {
        this.import_info.activeTab('error', this._TEXTS.fileError);
      }
    },

    _onClickGDButton: function(e) {
      this.killEvent(e);
      var self = this;

      var view = new google.picker.View(google.picker.ViewId.DOCS);

      var picker = new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.NAV_HIDDEN)
          .setAppId(cdb.config.get('gdrive_app_id') + ".apps.googleusercontent.com")
          .setSelectableMimeTypes(this._UPLOADER.acceptFileTypes.join(','))
          .addView(view)
          .addView(new google.picker.DocsUploadView())
          .setCallback(self._pickerCallback)
          .build();
       picker.setVisible(true);
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
