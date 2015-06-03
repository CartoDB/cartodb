
/**
 *  Import file pane
 *
 *  Place to drop, upload or select a file.
 *  It will check if the file is valid and let
 *  the user if he can sync it or not.
 *  
 *  - Uploader properties can be changed through
 *    options view.
 *
 *
 *  new cdb.admin.ImportFilePane(opts);
 *
*/

cdb.admin.ImportFilePane = cdb.admin.ImportPane.extend({

  events: {
    'click div.url p':          "_activateTextInput",
    'focusin input.url-input':  "_focusIn",
    'focusout input.url-input': "_focusOut",
    'keyup input.url-input':    "_onInputChange",
    'paste input.url-input':    "_onInputPaste",
    'submit form':              "submitUpload"
  },

  _UPLOADER: {
    url:              '',
    maxFileSize:      100000000,
    maxUploadFiles:   1,
    acceptFileTypes:  ['csv','xls','xlsx','zip','kml','geojson','json','ods','kmz','tsv',
                       'gpx','tar','gz','tgz','osm','bz2','tif','tiff','txt','sql'],
    acceptSync:       false,
    resolution:       ""
  },

  _TEXTS: {
    acceptFileTypesError: "{filename} has invalid extension. Only {extensions} are allowed.",
    urlError:             "There is an error in the URL you've inserted. Please recheck.",
    abortError:           "You have decided cancel the upload, start mapping with other file.",
    maxFileSizeError:     "{filename} is too large. You can import files up to {quota}.",
    resolutionError:      "{filename} is too big. You can only import files up to {resolution}.",
    connectionError:      "Sorry, there was a problem with the upload, try again please.",
    maxUploadFilesError:  "Sorry, we don't support upload more than one file at a time right now, but soon!"
  },

  initialize: function() {
    cdb.admin.ImportPane.prototype.initialize.call(this);

    _.bindAll(this, "_activateTextInput", "_onInputPaste", "_onInputChange", "_onDragOver",
      "_onDrop", "submitUpload", "_onUploadError", "_onUploadSubmit", "_focusIn", "_focusOut");
    this.template = this.options.template || cdb.templates.getTemplate('old_common/views/import/import_file');

    this.model.on('change:value change:interval', this._onValueChange, this);

    this.render();
  },

  render: function() {
    var $content = $('<div>');
    $content.append(this.template());
    var self = this;
    
    // Setup your file importer options
    // and messages
    _.each(this.options, function(val,i) {
      if (self._TEXTS[i] !== undefined)     self._TEXTS[i] = val
      if (self._UPLOADER[i] !== undefined)  self._UPLOADER[i] = val
    });

    // Init uploader
    this._initUploader($content);

    // Init import info (sync, error, user report, ... etc)
    this._initImportInfo($content);

    this.$el.append($content);

    return this;
  },

  _initUploader: function($content) {
    var $upload = this.$upload = $content.find("form");
    $upload.fileupload({
      dropZone:               $upload,
      url:                    this._UPLOADER.url,
      paramName:              'filename',
      progressInterval:       100,
      bitrateInterval:        500,
      maxFileSize:            this._UPLOADER.maxFileSize,
      autoUpload:             false,
      limitMultiFileUploads:  this._UPLOADER.maxUploadFiles,
      limitConcurrentUploads: this._UPLOADER.maxUploadFiles,
      acceptFileTypes:        this._setValidFileExtensions(this._UPLOADER.acceptFileTypes),
      add:                    this._onUploadAdd,
      submit:                 this._onUploadSubmit,
      drop:                   this._onDrop,
      dragover:               this._onDragOver,
      fail:                   this._onUploadError
    });

    // Bind mouse leave when drop is out of upload form
    $upload.bind("mouseleave",function() {
      $(this).removeClass("drop");
    });
  },

  _initImportInfo: function($content) {
    // It will show errors, sync, user,... etc
    this.import_info = new cdb.admin.ImportInfo({
      el:         $content.find('div.infobox'),
      model:      this.model,
      fileTypes:  this._UPLOADER.acceptFileTypes,
      acceptSync: this._UPLOADER.acceptSync
    });

    // If click over upgrade link
    this.import_info.bind('showUpgrade', function() {
      this.trigger('showUpgrade');
    }, this);
    
    this.addView(this.import_info);
  },


  //////////////////////////
  //          UI          //
  //////////////////////////

  // Activate url input when click over it
  _activateTextInput: function(e) {
    this.$("input.url-input").focus();
  },

  // Input focus in/out styles
  _focusIn: function(e) {
    this.$("div.upload").addClass("active");
  },
  _focusOut: function(e) {
    this.$("div.upload").removeClass("active");
  },

  // If url input change, hide uploader
  _onInputPaste: function(e) {
    // Hack necessary to get input value after a paste event
    // Paste event is fired before text is applied / added to the input
    setTimeout(this._onInputChange,100);
  },

  _onInputChange: function(e) {
    var url = this.getURL();

    // If form is submitted, go out!
    if (e && e.keyCode == 13) {
      this.submitUpload();
      return false;
    }

    // Set new changes in model
    this.model.set({
      type: 'url',
      value: url,
      valid: cdb.Utils.isURL(url) ? true : false
    });
  },

  // When value model property changes
  _onValueChange: function() {
    if (this.model.get('type') == "file") return;

    this[this.model.get('value') == "" ? '_showUploader' : '_hideUploader' ]();
    this.trigger('valueChange', this.model.get('value'), this);
  },

  // Show or hide uploader
  _showUploader: function(msg) {
    this.$('div.holder').fadeIn()
  },
  _hideUploader: function() {
    this.$('div.holder').fadeOut('fast')
  },

  cleanInput: function() {
    this.$("input.url-input").val('');
    this._onInputChange();
  },


  //////////////////////////
  //      UPLOADER        //
  //////////////////////////

    // You can drag a file, show the drop zone
  _onDragOver: function() {
    this.$upload.addClass("drop");
  },

  // Start upload if the drop element is a file
  _onDrop: function(ev,data) {
    if (data.files.length > 0) {
      this.$upload.removeClass("drop");

      // More than one file
      if (data.files.length > this._UPLOADER.maxUploadFiles) {
        this._onUploadError(null, {files: [{name: "", error: "maxUploadFiles"}]})
        return false;
      }
    }
  },

  _setValidFileExtensions: function(list) {
    return RegExp("(\.|\/)(" + list.join('|') + ")$", "i");
  },

  // When url input is fill and done
  submitUpload: function(e) {
    if (e) this.killEvent(e);

    var url = this.getURL();

    // Check url
    if (cdb.Utils.isURL(url)) {
      this._send();
    } else {
      this.import_info.activeTab('error', this._TEXTS.urlError);
    }
  },

  // If an upload fails
  _onUploadError: function(e,data) {
    var error = data.files[0].error || data.errorThrown;
    var filename = data.files[0].name;
    var msg = this._TEXTS[error + "Error"]
                .replace("{filename}", filename)
                .replace("{extensions}", this._UPLOADER.acceptFileTypes.join(', '))
                .replace("{resolution}", this._UPLOADER.resolution)
                .replace("{quota}", cdb.Utils.readablizeBytes(this._UPLOADER.maxFileSize));

    this.import_info.activeTab('error', msg);
  },

  _onUploadAdd: function(e,data) {
    data.submit();
  },

  _onUploadSubmit: function(e,data) {
    if (this.$upload.data('fileupload')._validate(data.files)) {
      // Set new values
      this.model.set({
        type:     'file',
        value:    data.files[0],
        interval: 0, // NEVER
        valid:    true
      });
      // Trigger changes
      this._send();
      return false;
    }
  },


  //////////////
  //   HELP   //
  //////////////
  getURL: function() {
    return this.$("input.url-input").val();
  },

  setValue: function(d) {
    if (d.type === "file") {
      this.$upload.fileupload('add', { files: [ d.value ] });
    } else {
      this.model.set(d, { silent: true });
      this._send();
    }
  },


  //////////////
  //   VIEW   //
  //////////////

  // Trigger model
  _send: function() {
    this.trigger('fileChosen', this.model.toJSON());
  },

  clean: function() {
    // Destroy fileupload
    this.$upload.fileupload("destroy");
    this.$upload.unbind("mouseleave");

    cdb.admin.ImportPane.prototype.clean.call(this);
  }
});