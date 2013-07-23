/**
 * Create the views for the import panes
 *
 * usage example:
 *
 *  var filePane = new cdb.ui.common.ImportSourcePane({
 *    template: cdb.templates.getTemplate('common/views/import_file')
 *  });
 *
*/

cdb.admin.ImportPane = cdb.core.View.extend({
  initialize: function() {
    this.template = this.options.template;
    this.render();
  },

  render: function() {
    this.$el.append(this.template({app_api_key: this.options.app_api_key}));
    return this;
  }
});




/**
 *  Import file
 *
 *  usage example:
 *
 *  var filePane = new cdb.ui.common.ImportSourcePane({
 *    template: cdb.templates.getTemplate('common/views/import_file')
 *  });
 *
*/

cdb.admin.ImportFilePane = cdb.admin.ImportPane.extend({

  events: {
    'click div.url p'            : "_activateTextInput",
    'focusin input[type="text"]' : "_focusIn",
    'focusout input[type="text"]': "_focusOut",
    'keyup input[type="text"]'   : "_onInputChange",
    'paste input[type="text"]'   : "_onInputPaste",
    'submit form'                : "_onSubmitForm",
    'click .common_data a'       : "_onCommonDataClick"  
  },

  _UPLOADER: {
    url:              '',
    maxFileSize:      100000000,
    maxUploadFiles:   1,
    acceptFileTypes:  /(\.|\/)(csv|xlsx?|zip|kml|geojson|json|ods|kmz|gpx|tar|gz|tgz|osm|bz2|tif|tiff|txt)$/i
  },

  _TEXTS: {
    acceptFileTypesError: "{filename} has invalid extension. Only csv, xlx, xlsx, zip, kml, geojson, \
                          json, ods, kmz, gpx, tar, gz, tgz, osm, bz2, tif and tiff are allowed.",
    urlError:             "There is an error in the URL you've inserted. Please recheck.",
    abortError:           "You have decided cancel the upload, start mapping with other file.",
    maxFileSizeError:     "{filename} is too large. You can import files up to {quota}.",
    maxUploadFilesError:  "Sorry, we don't support upload more than one file at a time right now, but soon!"
  },


  initialize: function() {
    _.bindAll(this, "_activateTextInput", "_onInputPaste", "_onInputChange", "_onDragOver",
      "_onDrop", "_onSubmitForm", "_onUploadError", "_onUploadSubmit", "_focusIn", "_focusOut");
    this.template = this.options.template;
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
      acceptFileTypes:        this._UPLOADER.acceptFileTypes,
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
    } else {
      this._hideUploader();
    }
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
      if (data.files.length > this._UPLOADER.maxUploadFiles)
        this._onUploadError(null, {files: [{name: "", error: "maxUploadFiles"}]})
    }
  },

  // When url input is fill and done
  _onSubmitForm: function(e) {
    if (e) {
      this.killEvent(e);
    }

    var url = this.$("input[type='text']").val();

    // Check url
    if (!cdb.Utils.isURL(url)) {
      this._showError(this._TEXTS.urlError);
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
                .replace("{quota}",cdb.Utils.readablizeBytes(this._UPLOADER.maxFileSize));

    this._showError(msg);
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

    // Show or hide error
  _showError: function(msg) {
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
