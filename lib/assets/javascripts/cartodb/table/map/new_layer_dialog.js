/**
 *
 *  Dialog to add a new layer from any of your
 *  existing tables.
 *
 *  Different ways to add a layer:
 *    0: Add an existant table
 *    1: Upload a new import file
 *    2: Create from scratch
 *    3: File from url
 *
 *  new cdb.admin.NewLayerDialog({
 *    tables: visualization_table_type,
 *    model:  visualization
 *  });
 *
 */

cdb.admin.NewLayerDialog = cdb.admin.BaseDialog.extend({

  _TEXTS: {
    title: _t('Add Layer'),
    description: _t('You can import data to this map or add one of your existing tables.'),
    upload: {
      acceptFileTypesError: "{filename} has invalid extension. Only csv, xlx, xlsx, zip, kml, geojson, json, \
                            ods, kmz, gpx, tar, gz, tgz, osm, bz2, tif and tiff are allowed.",
      urlError: "There is an error in the URL you've inserted. Please recheck.",
      abortError: "You have decided cancel the upload, start mapping with other file.",
      maxFileSizeError: "{filename} is too large. You can import files up to {quota}.",
      maxUploadFilesError: "Sorry, we don't support upload more than one file at a time right now, but soon!"
    },
    error: {
      unknown: _('Unknown'),
      default: _('Sorry, something went wrong and we\'re not sure what. Contact us at \
                  <a href="mailto:contac@cartodb.com">contact@cartodb.com</a>.')
    }
  },

  events: cdb.core.View.extendEvents({
    "click ul > li > a.radiobutton" : "_changeOption",
    'click div.url p'               : "_activateTextInput",
    'focusin input[type="text"]'    : "_focusIn",
    'focusout input[type="text"]'   : "_focusOut",
    'keyup input[type="text"]'      : "_onInputChange",
    'paste input[type="text"]'      : "_onInputPaste",
    'submit form'                   : "_onSubmitForm"
  }),

  initialize: function() {

    _.bindAll(this, "_onUploadError", "_onUploadProgress", "_onUploadStart",
      "_onUploadAbort", "_onInputPaste", "_onInputChange", "_onDragOver", "_onDrop",
      "_onUploadAdd", "_onUploadComplete", "_changeOption", "_checkOptions", "_keydown");

    // dialog options
    _.extend(this.options, {
      title: this._TEXTS.title,
      description: this._TEXTS.description,
      template_name: 'common/views/create_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: this._TEXTS.title,
      cancel_button_classes: 'margin5',
      modal_type: "creation",
      modal_class: 'new_layer_dialog',
      width: 572,
      acceptFileTypes: /(\.|\/)(csv|xlsx?|zip|kml|geojson|json|ods|kmz|gpx|tar|gz|tgz|osm|bz2|tif|tiff|txt)$/i
    });
    this.ok = this.options.ok;

    this.tableSelection = new cdb.core.Model();
    this.constructor.__super__.initialize.apply(this);
    this.setWizard(this.options.wizard_option);

    this.tables = this.options.tables;

    // Due to an api limitation, it is only posible
    // to get 300 tables per page.
    this.tables.options.set({ type: 'table', per_page:300 });
    this.active = false;
  },

  render_content: function() {
    this.$content = $("<div>");
    var temp_content = this.getTemplate('table/views/new_layer_dialog');

    this.$content.append(temp_content());

    this.tables.fetch();
    this.tables.bind('reset', this._onReset, this);
    this.tables.bind('error', this._onError, this);
    this.add_related_model(this.tables);
    this.disableOkButton();

    // Save references
    this.$loader      = this.$content.find("div.progress");
    this.$list        = this.$content.find("ul.options");
    this.$import      = this.$content.find("div.upload");
    this.$holder      = this.$content.find("div.holder");
    this.$error       = this.$el.find("section.modal.error");
    this.$importation = this.$el.find("section.modal:eq(0)");

    // Hide error... for the moment
    this.$error.hide();

    // Create the fileupload
    var $upload = this.$upload = this.$content.find("form");
    $upload.fileupload({
      dropZone: $upload,
      url: '/api/v1/imports',
      paramName: 'filename',
      progressInterval: 100,
      bitrateInterval: 500,
      maxFileSize: this.options.quota,
      autoUpload: true,
      limitMultiFileUploads: 1,
      limitConcurrentUploads: 1,
      add: this._onUploadAdd,
      acceptFileTypes: this.options.acceptFileTypes,
      drop: this._onDrop,
      dragover: this._onDragOver,
      progress: this._onUploadProgress,
      start: this._onUploadStart,
      done: this._onUploadComplete,
      fail: this._onUploadError
    });

    return this.$content;
  },

  /**
   *  LIST OPTIONS
   *    - Import option 0 and 1 functions
   */

  // Activate url input when click over it
  _activateTextInput: function(ev) {
    this.$import.find("input[type='text']").focus();
  },

  // Input focus in/out styles
  _focusIn: function(ev) {
    $(ev.target).closest("div.upload").addClass("active");
  },
  _focusOut: function(ev) {
    $(ev.target).closest("div.upload").removeClass("active");
  },

  // If url input change, hide uploader
  _onInputPaste: function(ev) {
    // Hack necessary to get input value after a paste event
    // Paste event is fired before text is applied / added to the input
    setTimeout(this._onInputChange,100);
  },

  _onInputChange: function(ev) {
    var $el = this.$import.find("input[type='text']")
      , val = $el.val();

    // If form is submitted, go out!
    if (ev && ev.keyCode == 13) {
      return false;
    }

    if (val == "") {
      this.option = 1;
      this.enable = false;
      this._hideUploadError();
      this._showUploader();
    } else {
      this.option = 3;
      this.enable = true;
      this._hideUploader();
    }

    this._checkOptions();
  },

  /**
   *  UPLOADER FUNCTIONS
   */

  // When an upload starsts
  _onUploadStart: function(ev,data) {
    this._changeState("uploading");
  },

  // Change progress of a file
  _onUploadProgress: function(ev,data) {
    var loaded = data.loaded
      , total = data.total;

    var percentage = (loaded / total) * 100;
    this.$content
      .find("div.progress span")
      .width(percentage + "%");
  },

  // If user cancels an upload
  _onUploadAbort: function(ev) {
    if (ev)
      ev.preventDefault();
    this.jqXHR.abort();
  },

  // Upload complete, YAY!
  _onUploadComplete: function(ev,data) {
    this._changeState("importing");
    this._importTable(data.result.item_queue_id);
  },

  // If an upload fails
  _onUploadError: function(ev,data) {
    this._changeState("reset");

    var error = data.files[0].error || data.errorThrown
      , filename = data.files[0].name
      , msg = this._TEXTS.upload[error + "Error"].replace("{filename}", filename).replace("{quota}",this._readablizeBytes(this.options.quota));

    this._showUploadError(msg);
  },

  // When a file is added, start the upload
  _onUploadAdd: function(ev,data) {
    if (data.originalFiles.length == 1) {
      this.jqXHR = data.submit();
    }
  },

  // You can drag a file, show the drop zone
  _onDragOver: function() {
    this.$upload.addClass("drop");
  },

  // Start upload if the drop element is a file
  _onDrop: function(ev,data) {
    if (data.files.length > 0) {
      this.$upload.removeClass("drop");

      // More than one file
      if (data.files.length > 1)
        this._onUploadError(null, {files: [{name: "", error: "maxUploadFiles"}]})
    }
  },

  // Close the dialog only if it is enable
  _keydown: function(e) {

    if (e.keyCode === 27) {
      this._cancel();
    }

  },

  _onReset: function() {
    this.tables.unbind(null, null, this);

    if (this.tableCombo) this.tableCombo.clean();

    var tableList = this.tables.pluck('name');
    this.result = tableList[0];

    this._onComboChange(this.result);
    this.enableOkButton();

    this.tableCombo = new cdb.forms.Combo({
      el: this.$content.find('.tableListCombo'),
      model: this.tableSelection,
      property: "table",
      width: '468px',
      extra: tableList
    });

    this.tableCombo.bind('change', this._onComboChange, this)
    this.tableCombo.render();
    this.$el.find(".combo_wrapper").fadeIn(250);

    // Show list and hide loader
    this._hideLoader();
    this._showList();
    this._hideError();

    this.active = true;
  },

  _onComboChange: function(table_name) {
    var self = this;
    this.result = table_name;

    // Remove all warnings
    this._hidePrivacyChange();
    this._hideGeoWarning();

    // Get table from tables collection
    var table_vis = this.tables.find(function(table){ return table.get('name') == table_name; });

    // Check if table has any georeference data and warn the user :S
    var table_metadata = new cdb.admin.CartoDBTableMetadata({ id: table_vis.get("table").id });
    table_metadata.fetch({
      success: function(m) {
        // Check if actual table is the same requested
        if (self.result == m.get('name') && m.get('geometry_types').length == 0) {
          self._showGeoWarning();
        }
      }
    });

    // Check if table is private and warn the user that the visualization will turn to private
    if (table_vis.get('privacy').toLowerCase() == "private" && this.model.get('privacy').toLowerCase() != "private") {
      this._showPrivacyChange();
      this.private_vis = true;
    } else {
      this.private_vis = false;
    }
  },

  _onError: function() {
    this._hideLoader();
    this._removeList();
    this._showError();
  },

  /**
   *  APP ACTIONS (create, import, error)
   */

  // Import table
  _importTable: function(item_queue_id) {

    this.active = false;

    var self = this
      , imp = this.importation = new cdb.admin.Import({ item_queue_id: item_queue_id })
      .bind("importComplete", function(e){
        imp.unbind();
        self.hide();
        self.ok && self.ok(imp.get("table_name"));
      },this)
    .bind("importError", function(e){
      self._showImportError(e.attributes.error_code, e.attributes.get_error_text.title, e.attributes.get_error_text.what_about);
    },this);

    imp.pollCheck();

    this.item_queue_id = item_queue_id;
  },

  // Create a new layer from scratch
  _createLayer: function() {
    var self = this;
    var new_table = new cdb.admin.CartoDBTableMetadata();

    new_table.save(null, {
      success: function(lyr) {
        self.hide();
        self.ok && self.ok(lyr.get('name'), lyr.get('privacy'));
      },
      error: function(e) {
        self._hideLoader();
        try {
          self._showError(
            e.attributes.error_code,
            e.attributes.get_error_text.title,
            e.attributes.get_error_text.what_about
          );
        } catch(e) {
          self._showError('99999',self._TEXTS.error.default.unknown, self._TEXTS.error.default);
        }
      }
    });
  },

  // When url input is fill and done
  _onSubmitForm: function(ev) {
    if (ev) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    // Set option
    this.option = 3;

    var url = this.$import.find("input[type='text']").val()
      , self = this;

    // Check url
    if (!this._checkURL(url)) {
      this._showUploadError(this._TEXTS.upload.urlError);
      return false;
    } else {
      this._hideUploadError();
    }

    // Change state
    this._changeState("importing");

    // Get item_queue_id
    $.ajax({
      type: "POST",
      url: "/api/v1/imports",
      data: { url: this._sanitizeUrl(url) },
      success: function(r) {
        self._importTable(r.item_queue_id)
      },
      error: function(e) {
        self._showUploadError(self._TEXTS.upload.urlError);
      }
    });
  },

  // Show error when an import fails
  _showImportError: function(number,description,wadus) {
    // Add data
    var template = cdb.templates.getTemplate("common/views/error_dialog_content")
      , opts = {number: number, description: description, about:wadus};

    this.$error.find("div.error_content").html(template(opts));

    // Show error and hide importation window
    this.$el.find(".modal:eq(0)").animate({
      opacity: 0,
      marginTop: 0,
      height: 0,
      top: 0
    },function(){
      $(this).remove();
    });

    this.$el.find(".modal:eq(1)")
      .css({
        opacity:0,
        display:"block",
        marginTop: "0px"
      })
      .animate({
        opacity: 1,
        marginTop: "100px"
      },600);
  },



  /**
   *  UI change functions
   */

  // Show loader
  _showLoader: function() {
    this.$loader.addClass("active");
  },

  // Hide loader
  _hideLoader: function() {
    this.$loader.removeClass("active creating uploading");
  },

  // Change ui state (NEW)
  _changeState: function(mode) {
    var actions = cdb.admin.upload_states[mode];

    // Set dialog params
    this.enable = actions.enable;
    this.option = actions.option;

    // Remove additional and error info
    if (actions.hideUpload)
      this._hideUploadError();

    // Change title
    this.$importation
      .find("h3")
      .text(actions.title);

    // Change description
    this.$importation
      .find("div.head p")
      .text(actions.description_new_layer);

    // Hide close?
    this.$importation.find("a.close").stop()[actions.hideClose ? "fadeOut" : "fadeIn"]();

    // Main button (OK) classes
    if (mode == 'importing') {
      this.$importation.find("div.foot a.ok").hide();
    } else {
    this.$importation.find("div.foot a.ok")
      .removeClass(actions.ok.removeClasses)
      .addClass(actions.ok.addClasses)
      .text(actions.ok.text).hide();
    }

    // Adding foot description?
    if (actions.foot) {
      var $foot_desc = $("<p>").addClass("margin5 left small").text(actions.foot.text);

      this.$importation
        .find("div.foot")
        .append($foot_desc);
    }

    // List animation
    this.$list.stop().animate(actions.list.animate.properties,actions.list.animate.options);

    // Loader animation and setting up
    var pos = this.$list.position();

    if (actions.loader.progress) {
      this.$loader.find("span").width(actions.loader.progress + "%");
      this.$loader.find("p").text(actions.loader.text)
    }

    actions.loader.animate.properties.top = _.template(String(actions.loader.animate.properties.top), {top: pos.top});

    if (mode == "reset")
      actions.loader.animate.properties.top = actions.loader.animate.properties.top - 20;

    this.$loader
      .removeClass(actions.loader.removeClasses)
      .addClass(actions.loader.addClasses)
      .css(actions.loader.css)
      .stop()
      .animate(
          actions.loader.animate.properties
          , actions.loader.animate.options
          )

      // Show stop
      if (actions.stop) {
        this.$loader.find("a.stop").show();
      } else {
        this.$loader.find("a.stop").hide();
      }

    // Show loader?
    if (actions.showLoader) {
      this._showLoader();
    } else {
      this._hideLoader();
    }
  },

  // Check url
  _checkURL: function(value) {
    var urlregex = /^((http|https|ftp)\:\/\/)/g;

    return urlregex.test(value);
  },

  // Sanitize the url (add http at the beginning if it doesn't have http or https)
  _sanitizeUrl: function(url) {
    if (url.search('http://') == 0 || url.search('https://') == 0) {
      return url;
    } else {
      return "http://" + url;
    }
  },

  // Return bytes to readable size
  _readablizeBytes: function(bytes) {
    var s = ['bytes', 'kb', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes)/Math.log(1024));
    return (bytes/Math.pow(1024, Math.floor(e))).toFixed(2)+" "+s[e];
  },

  // Show or hide uploader
  _showUploader: function() { this.$holder.show() },
  _hideUploader: function() { this.$holder.hide() },

  // Show or hide error
  _showUploadError: function(msg) {
    this.$content
        .find("div.info")
        .addClass("error active")
        .find("p")
        .text(msg);
    this.$el.find("li.upload").addClass("error");
  },

  _hideUploadError: function() {
    this.$content
        .find("div.info")
        .removeClass("error active")
    this.$el.find("li.upload").removeClass("error");
  },


  // toggle views functions

  _showGeoWarning: function() { this.$('p.warning.geo').fadeIn(); },

  _hideGeoWarning: function() { this.$('p.warning.geo').fadeOut(); },

  _showPrivacyChange: function() { this.$('p.warning.privacy').fadeIn(); },

  _hidePrivacyChange: function() { this.$('p.warning.privacy').fadeOut(); },

  _showLoader: function() { this.$('span.loader').fadeIn(); },

  _hideLoader: function() { this.$('span.loader').hide(); },

  _showError: function() { this.$('p.warning.error').fadeIn(); },

  _hideError: function() { this.$('p.warning.error').fadeOut(); },

  _showList: function() { this.$('.options').css('opacity', 1); },

  _removeList: function() { this.$('.options ul.options').remove(); },


  // change options actions

  _changeOption: function(ev) {
    ev.preventDefault();

    var $el   = $(ev.target).closest('a.radiobutton')
      , $list = $el.closest("ul")
      , $li   = $el.closest("li");

    // Stop if option is disabled
    if ($el.hasClass("disabled") || $el.hasClass("selected")) return false;

    // If not activate it and desactivate previous one
    $list
      .find("li.active")
      .removeClass("active")
      .find(" > a.radiobutton")
      .removeClass("selected")

      this.option = parseInt($li.attr("data-option"), 10);

    $el.addClass("selected");
    $li.addClass("active");

    this._checkOptions();
  },

  // Check if the option clicked is active or not.
  _checkOptions: function() {
    if (this.option != 1) {
      this.active = true;
      this.$("a.ok").removeClass("disabled")
    } else {
      this.active = false;
      this.$("a.ok").addClass("disabled")
    }
  },

  _ok: function(e) {
    if (e) e.preventDefault();

    if (this.active) {
      switch (this.option) {
        case 0: this.ok && this.ok(this.result, this.private_vis);
                this.hide();
                break;
        case 1: this._onSubmitForm();
                break;
        case 2: // Change dialog state
                this._changeState("creating");
                // Create table
                this._createLayer();
                break;
        default: cdb.log.info("Invalid option " + this.option + " in 'add layer'");
      }
    }
  },

  // Close the dialog only if it is enable
  _keydown: function(e) {
    if (e.keyCode === 27 && this.enable) {
      if (this.option == 3) {
        this._ok();
      } else {
        this._cancel();
      }
    }
  },

  // Reclean some custom bindings
  _reClean: function() {
    // Destroy fileupload
    this.$upload.fileupload("destroy");
    this.$upload.unbind("mouseleave");

    // Remove keydown binding
    $(document).unbind('keydown', this._keydown);

    // Cancel upload in case there is one active
    if (this.jqXHR)
      this._onUploadAbort();
  }
});
