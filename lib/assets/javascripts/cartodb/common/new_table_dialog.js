

cdb.admin.CreateTableDialog = cdb.ui.common.Dialog.extend({

  /*
    Different ways to create a table:
      0: Upload a local file
      1: Upload a web file
      2: Create from scratch
      3: All done, you can minimize the window
  */


  events: {
    'click .ok'                     : 'ok',
    'click .cancel'                 : '_cancel',
    'click .close'                  : '_cancel',

    "click ul > li > a.radiobutton" : "_changeOption",
    'click div.url p'               : "_activateTextInput",
    'keyup input[type="text"]'      : "_onInputChange",
    'submit form'                   : "_onSubmitForm"
  },


  initialize: function() {

    // We need "this" in these functions
    _.bindAll(this, "_activateTextInput", "_createTable", "_onUploadError", "_onUploadProgress", "_onUploadStart",
      "_onUploadDragOver", "_onUploadStop", "_onUploadAdd", "_onUploadComplete", "_changeOption", "_checkOptions");

    // Option selected by default
    this.option = 0;

    // Active flag when the table is uploading or creating or loading...
    this.enable = true;

    // Extend options
    _.extend(this.options, {
      title: 'New table',
      description: 'Choose between the following options to create a new table.',
      template_name: 'dashboard/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button green disabled",
      ok_title: "Create table",
      modal_type: "creation",
      width: 600,
      error_messages: {
        "acceptFileTypes": "{filename} has invalid extension. Only csv, xlx, xlsx, zip, kml, geojson, json, ods, kmz, gpx, tar, gz, tgz, osm, bz2, tif and tiff are allowed."
      },
      acceptFileTypes: /(\.|\/)(csv|xlsx?|zip|kml|geojson|json|ods|kmz|gpx|tar|gz|tgz|osm|bz2|tif|tiff)$/i
    });
    this.constructor.__super__.initialize.apply(this);


    // Re-clean after destroy this View
    this.bind("clean", this._reClean);
  },


  /**
   * Render the content for the create dialog
   */
  render_content: function() {

    // Add correct html
    var $content = this.$content = $("<div>");
    this.temp_content = cdb.templates.getTemplate('dashboard/views/create_dialog_content');
    $content.append(this.temp_content());

    // Save references
    this.$loader      = $content.find("div.progress");
    this.$list        = $content.find("ul");
    this.$import      = $content.find("div.upload");
    this.$holder      = $content.find("div.holder");
    this.$error       = this.$el.find("section.modal.error");
    this.$importation = this.$el.find("section.modal:eq(0)");

    // Hide error... for the moment
    this.$error.hide();


    // Create the fileupload
    var $upload = this.$upload = $content.find("form");
    $upload.fileupload({
      dropZone: $upload,
      url: '/api/v1/imports',
      paramName: 'filename',
      progressInterval: 100,
      bitrateInterval: 500,
      maxFileSize: 0,
      autoUpload: true,
      add: this._onUploadAdd,
      acceptFileTypes: this.options.acceptFileTypes,

      drop: this._onDrop,
      dragover: this._onUploadDragOver,

      progress: this._onUploadProgress,
      start: this._onUploadStart,
      stop: this._onUploadStop,
      done: this._onUploadComplete,
      fail: this._onUploadError
    });
    
    // Have you dropped a file in the big mamufas?
    if (this.options.files) {
      $upload.fileupload('send', {files: this.options.files});
    }

    return this.$content;
  },



  /*
    Import option 0 and 1 functions 
  */

  _activateTextInput: function(ev) {
    this.$import.find("input[type='text']").focus();
  },

  _onInputChange: function(ev) {
    var $el = $(ev.target)
      , val = $el.val();

    if (val == "") {
      this.option = 0;
      this.enable = false;
      this._showUploader();
    } else {
      this.option = 1;
      this.enable = true;
      this._hideUploader();
    }

    this._checkOptions();
  },

  _onSubmitForm: function(ev) {
    ev.preventDefault();
    ev.stopPropagation();

    var code = (ev.keyCode ? ev.keyCode : ev.which);
    if(code == 13) { //Enter keycode
       this.$el.find("a.ok").click();
    }
  },

  _showUploader: function() { this.$holder.show() },
  _hideUploader: function() { this.$holder.hide() },




  _changeOption: function(ev) {
    ev.preventDefault();

    var $el   = $(ev.target)
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

    this.option = $li.attr("data-option");

    $el.addClass("selected");
    $li.addClass("active");


    this._checkOptions();
  },


  _checkOptions: function() {
    if (this.option == 2 || this.option == 1) {
      this.$el.find("a.ok").removeClass("disabled")
    } else {
      this.$el.find("a.ok").addClass("disabled")
    }
  },










  /* Uploader functions */
  _onUploadStart: function(ev,data) {
    console.log("uploading!");
    this._changeState("uploading");
  },

  _onUploadProgress: function(ev,data) {
    console.log("progress!", data);
    var loaded = data.loaded 
      , total = data.total;

    var percentage = (loaded / total) * 100;
    this.$content
      .find("div.progress span")
      .width(percentage + "%");
  },

  _onUploadStop: function(ev,data) {
    console.log("stop!");
    // console.log(id,fileName);
    // if (id.result) {
    //   this._changeState("reset"); 
    // }
    //this._changeState("reset");
  },

  _onUploadComplete: function(ev,data) {
    console.log("done!");
    this._changeState("importing");
    this._importTable(data.result.item_queue_id)
  },

  _onUploadError: function(ev,data) {
    console.log("error!", data);

    this._changeState("reset");

    var filename = data.files[0].name
      , error_type = data.files[0].error
      , msg = this.options.error_messages[error_type].replace("{filename}", filename);

    this.$content
      .find("div.info")
      .addClass("error active")
      .find("p")
      .text(msg);
  },

  _onUploadAdd: function(ev,files) {
    files.submit();
  },


  _onUploadDragOver: function() {
    console.log("TODO -> SHOW THE CLASS!");
    this.$upload.addClass("drop");
  },



















  // Import table from a url
  _importTable: function(item_queue_id) {

    var self = this;

    var imp = new cdb.admin.Import({item_queue_id: item_queue_id})
     .bind("importComplete", function(){
        console.log("final!!");
      },this)
      .bind("importError", function(e){
        console.log(e);
        self._showError(e.attributes.error_code,e.attributes.logger,'what about');
      },this);

    this.trigger('importStarted', imp);
    //imp.save();
    //this.hide();
  },


  // Create a new table from scratch
  _createTable: function() {
    var self = this;

    // Bind tables change
    this.options.tables
      .bind("add", function(m) {
        window.location.href = "/tables/" + m.get("id");
      },this)
      .bind("error", function(m) {
        self._hideLoader();
      }, this)

    // Create the new table
    this.options.tables.create();
  },





  _showError: function(number,description,wadus) {


    // Add data
    var template = cdb.templates.getTemplate("dashboard/views/error_dialog_content")
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













  _showLoader: function() {
    this.$loader.addClass("active");
  },

  _hideLoader: function() {
    this.$loader.removeClass("active creating uploading");
  },



  _changeState: function(mode) {
    console.log("changeState" + ":" + mode);

    /* Change scenario depending on the app mode */
    switch (mode) {
      case "reset":
        // Remove additional and error info
        this.$importation
          .find("div.info")
          .removeClass("active");

        // Change title
        this.$importation
          .find("h3")
          .text("New table");

        // Change description
        this.$importation
          .find("div.head p")
          .text("Choose between the following options to create a new table.");
 
        // Hide close
        this.$importation.find("a.close").fadeIn();

        // Remove foot description
        this.$importation.find("div.foot p").remove();

        // Disable ok button and disabled dialog
        this.enable = true;
        this.option = 0;
        this.$importation.find("div.foot a.ok").addClass("disabled green").removeClass("grey");

        // Show options list
        this.$list.stop().animate({
          marginTop: "0px",
          height: "100%",
          opacity: 1
        }, 1000);

        // Customize the loader
        var pos = this.$list.position();

        this.$loader
          .animate({
            top: (pos.top - 20) + "px",
            opacity: 0
          })
          .removeClass("creating uploading");

        // Show the loader
        this._hideLoader();
        break;

      case "creating":

        // Remove additional and error info
        this.$importation
          .find("div.info")
          .removeClass("active");

        // Change title
        this.$importation
          .find("h3")
          .text("Creating your table...");

        // Change description
        this.$importation
          .find("div.head p")
          .text("Give us some second to create it and then you will be redirected...");
 
        // Hide close
        this.$importation.find("a.close").fadeOut();

        // Disable ok button and disabled dialog
        this.enable = false;
        this.$importation.find("div.foot a.ok").addClass("disabled");

        // Hide options list
        this.$list.animate({
          marginTop: "-30px",
          height: 0,
          opacity: 0
        }, {duration: 1500, queue: true});

        // Customize the loader
        this.$loader.find("span").width("100%");
        this.$loader.find("p").text("Creating your table...")
        var pos = this.$list.position();

        this.$loader
          .css({
            top: pos.top + "px"
          })
          .addClass("creating");

        // Show the loader
        this._showLoader();

        break;
      case "uploading":

        // Change title
        this.$importation
          .find("h3")
          .text("Uploading your data");

        // Change description
        this.$importation
          .find("div.head p")
          .text("It will take us some time...");
 
        // Hide close
        this.$importation.find("a.close").fadeOut();

        // Disable ok button and disabled dialog
        this.enable = false;
        this.$importation.find("div.foot a.ok").addClass("disabled");

        // Hide options list
        this.$list.animate({
          marginTop: "-10px",
          height: 0,
          opacity: 0
        }, {duration: 1500, queue: true});

        // Customize the loader
        var pos = this.$list.position();

        this.$loader.find("span").width("4%");
        this.$loader.find("p").text("Uploading your table...");

        this.$loader
          .css({top: '40px', opacity: '0'})
          .removeClass("creating")
          .addClass("uploading")
          .animate({
            opacity: 1,
            top: pos.top
          },1000)
          
        // Show the loader
        this._showLoader();

        break;
      case "importing":

        // Change title
        this.$importation
          .find("h3")
          .text("Creating your table...");

        // Changing head description
        this.$importation
          .find("div.head p")
          .text("Now, you can hide this window and your table creation will continue.");

        // Adding foot description
        var $desc_f = $("<p>").addClass("margin5 left small").text("When hiding this window, follow the progress in the bottom left corner of your screen.");

        this.$importation
          .find("div.foot")
          .append($desc_f);
 
        // Hide close
        this.$importation.find("a.close").fadeOut();

        // Ok button now hides the dialog
        this.enable = true;
        this.option = 3;
        this.$importation.find("div.foot a.ok")
          .addClass("grey")
          .removeClass("green disabled")
          .text("Hide this window");

        // Hide options list
        this.$list.animate({
          marginTop: "-10px",
          height: 0,
          opacity: 0
        }, {duration: 1500, queue: true});

        // Customize the loader
        this.$loader.find("span").width("100%");
        this.$loader.find("p").text("Creating your table...")
        var pos = this.$list.position();

        this.$loader
          .animate({
            left: "40px",
            top: pos.top + "px"
          },1000)
          .addClass("creating");

        // Show the loader
        this._showLoader();
        break;
      default:
    }
  },









  /**
   *  When you click in the ok button
   */
  ok: function(ev) {
    ev.preventDefault();

    // No active, no fun
    if (!this.enable) return false;

    // Let's surf in the options
    switch (parseInt(this.option)) {
      case 0: break;
      case 1:
        // Web file
        var url = this.$import.find("input[type='text']").val();

        // Change dialog state
        this._changeState("importing");

        // Import table
        this._importTable(url,url);

        break;
      case 2:
        // New table
        var self = this;

        // Change dialog state
        this._changeState("creating");

        // Create table
        this._createTable();

        break;
      case 3:
        // Background importer dude!
        this.hide();
        break;
      default: cdb.log.info(":S");
    }
  },


  /**
   *  Hide the dialog
   */
  hide: function() {
    var self = this;

    this.$el.find(".modal").animate({
      marginTop: "50px",
      opacity: 0
    },300, function() {
      if(self.options.clean_on_hide) {
        self.clean();
      }
    });
    this.$el.find(".mamufas").fadeOut(300);
    this.trigger("closedDialog", this , this);
  },


  /**
   *  Show the dialog
   */
  open: function() {
    var self = this;

    this.$el.find(".modal").css({
      "opacity": "0",
      "marginTop": "150px"
    });

    this.$el.find(".mamufas").fadeIn();
    this.$el.find(".modal").animate({
      marginTop: "100px",
      opacity: 1
    },300);
  },


  /**
   *  Reclean some custom bindings
   */
  _reClean: function() {
    // Cancel upload
    // TODO //
    this.$upload.fileupload("destroy");
  }
})
