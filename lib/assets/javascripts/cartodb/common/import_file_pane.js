
/**
 *  Import file
 *
 *  usage example:
 *
 *  var filePane = new cdb.ui.common.ImportSourcePane(opts);
 *
*/

cdb.admin.ImportFilePane = cdb.admin.ImportPane.extend({

  events: {
    'click div.url p'            : "_activateTextInput",
    'focusin input[type="text"]' : "_focusIn",
    'focusout input[type="text"]': "_focusOut",
    'keyup input[type="text"]'   : "_onInputChange",
    'paste input[type="text"]'   : "_onInputPaste",
    'submit form'                : "submitForm",
    'click .common_data a'       : "_onCommonDataClick"  
  },

  _UPLOADER: {
    url:              '',
    maxFileSize:      100000000,
    maxUploadFiles:   1,
    acceptFileTypes:  ['csv','xls','xlsx','zip','kml','geojson','json','ods','kmz',
                       'gpx','tar','gz','tgz','osm','bz2','tif','tiff','txt']
  },

  _TEXTS: {
    acceptFileTypesError: "{filename} has invalid extension. Only {extensions} are allowed.",
    urlError:             "There is an error in the URL you've inserted. Please recheck.",
    abortError:           "You have decided cancel the upload, start mapping with other file.",
    maxFileSizeError:     "{filename} is too large. You can import files up to {quota}.",
    connectionError:      "Sorry, there was a problem with the upload, try again please.",
    maxUploadFilesError:  "Sorry, we don't support upload more than one file at a time right now, but soon!"
  },

  initialize: function() {
    _.bindAll(this, "_activateTextInput", "_onInputPaste", "_onInputChange", "_onDragOver",
      "_onDrop", "submitForm", "_onUploadError", "_onUploadSubmit", "_focusIn", "_focusOut");
    this.template = this.options.template || cdb.templates.getTemplate('common/views/import_file');
    this.render();
  },

  render: function() {
    var $content = $('<div>');
    $content.append(this.template());

    // Setup your file importer
    _.extend(this._UPLOADER, this.options);

    // Init uploader
    this._initUploader($content);

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


  //////////////////////////
  //          UI          //
  //////////////////////////

  // Trick to catch mixpanel event
  _onCommonDataClick: function(e) {
    this.killEvent(e);
    cdb.god.trigger('mixpanel', 'Common data clicked');
    window.location = $(e.target).attr('href');
  },

  // Activate url input when click over it
  _activateTextInput: function(e) {
    this.$("input[type='text']").focus();
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
    var $el = this.$("input[type='text']")
      , val = $el.val();

    // If form is submitted, go out!
    if (e && e.keyCode == 13) {
      return false;
    }

    if (val == "") {
      this._hideError();
      this._showUploader();
      this.trigger('inputChange', '', this);
    } else {
      this._hideUploader();
      this.trigger('inputChange', val, this);
    }
  },

  // Show or hide error
  showError: function(msg) {
    this.$("div.info")
      .addClass("error active")
      .find("p")
      .text(msg);
  },
  _hideError: function() {
    this.$("div.info").removeClass("error active")
  },

  // Show or hide uploader
  _showUploader: function(msg) {
    this.$('div.holder').fadeIn()
  },
  _hideUploader: function() {
    this.$('div.holder').fadeOut('fast')
  },

  cleanInput: function() {
    this.$("input[type='text']").val('');
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
  submitForm: function(e) {
    if (e) {
      this.killEvent(e);
    }

    var url = this.$("input[type='text']").val();

    // Check url
    if (!cdb.Utils.isURL(url)) {
      this.showError(this._TEXTS.urlError);
    } else {
      this._hideError();
      this._triggerValue('url', url);
    }
  },

  // If an upload fails
  _onUploadError: function(e,data) {
    var error = data.files[0].error || data.errorThrown
      , filename = data.files[0].name
      , msg = this._TEXTS[error + "Error"]
                .replace("{filename}", filename)
                .replace("{extensions}", this._UPLOADER.acceptFileTypes.join(', '))
                .replace("{quota}",cdb.Utils.readablizeBytes(this._UPLOADER.maxFileSize));

    this.showError(msg);
  },

  _onUploadAdd: function(e,data) {
    data.submit();
  },

  _onUploadSubmit: function(e,data) {
    if (this.$upload.data('fileupload')._validate(data.files)) {
      // Hide error in any case
      this._hideError();
      // Send trigger with value :)
      this._triggerValue('file', data.files[0]);
      return false;
    }
  },


  //////////////
  //   HELP   //
  //////////////
  getURL: function() {
    return this.$("input[type='text']").val();
  },


  //////////////
  //   VIEW   //
  //////////////

  // Send chosen value
  _triggerValue: function(type, value) {
    this.trigger('fileChosen', type, value);
  },

  clean: function() {
    // Destroy fileupload
    this.$upload.fileupload("destroy");
    this.$upload.unbind("mouseleave");

    cdb.admin.ImportPane.prototype.clean.call(this);
  }
});
