

cdb.admin.CreateTableDialog = cdb.ui.common.Dialog.extend({

  events: {
    "click ul > li > a.radiobutton" : "_changeOption",
    'click .ok': 'ok',
    'click .cancel': '_cancel',
    'click .close': '_cancel'
  },

  initialize: function() {

    _.bindAll(this, "_createTable", "_onUploadError", "_onUploadSubmit", "_onUploadProgress", "_changeOption", "_checkOptions");


    // Option selected by default
    this.option = 0;

    // Active flag when the table is uploading or creating or loading...
    this.active = true;

    _.extend(this.options, {
      title: 'New table',
      description: '',
      template_name: 'common/views/dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button green disabled",
      ok_title: "Create table",
      modal_type: "creation"//,
      //model: this.model
    });
    this.constructor.__super__.initialize.apply(this);
  },

  render_content: function() {

    // Add correct html
    var $content = this.$content = $("<ul>").addClass("options");

    this.temp_content = cdb.templates.getTemplate('dashboard/views/create_dialog_content');
    $content.append(this.temp_content());

    // Bind events
    var $upload = $content.find("div.upload")
      , uploader = this.uploader = new qq.FileUploader({
        element: $upload[0],
        action: '/api/v1/uploads',
        sizeLimit: 0, // max size   
        minSizeLimit: 0, // min size
        allowedExtensions: ['csv', 'xls', 'xlsx', 'zip', 'kml', 'geojson', 'json', 'ods', 'kmz', 'gpx', 'tar', 'gz', 'tgz', 'osm', 'bz2', 'tif', 'tiff'],
        onSubmit: this._onUploadSubmit,
        onProgress: this._onUploadProgress,
        onCancel: this._onUploadCancel,
        onComplete: this._onUploadComplete,
        showMessage: this._onUploadError
      });

    return $content;
  },





  _onUploadSubmit: function(id,fileName) {

    // this.$content
    //   .find("div.info")
    //   .removeClass("active")

    // this.$content
    //   .find("div.progress")
    //   .addClass("active");

    // console.log(this.$el);

    // this.$el.css({overflow: "hidden", "max-height":"328px"});

    // this.$el.animate({
    //   height: "328px"
    // }, 500);

    // // Remove rest of elements
    // this.$content.find("li:gt(0)").animate({
    //   opacity: 0,
    //   zIndex: 0,
    //   position: "absolute",
    //   marginTop: "50px"
    // },500, function() {
    //   $(this).remove();
    // })

    // this.$content.find("li:eq(0) a.radiobutton").animate({
    //   opacity:0
    // },500, function() {
    //   $(this).remove();
    // });
    
  },

  _onUploadProgress: function(id, fileName, loaded, total) {
    var percentage = (loaded / total) * 100;
    this.$content
      .find("div.progress span")
      .width(percentage + "%");
  },

  _onUploadCancel: function(id, fileName) {

  },

  _onUploadComplete: function(id, fileName, responseJSON) {
    this._createTable(fileName,responseJSON.file_uri)
  },

  _onUploadError: function(message) {
    this.$content
      .find("div.info")
      .addClass("error active")
      .find("p")
      .text(message)
  },






  _createTable: function(fileName,file_uri) {

    var opts = null;

    if (fileName != null && file_uri != null) {
      opts = {
        table_name: fileName,
        file_uri: file_uri
      };
    }

    var imp = new cdb.admin.Import().bind("importComplete", function(){
      console.log("final!!");
    },this)
    this.trigger('importStarted', imp);
    //imp.save();
    self.hide();
  },





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

    this.option = $li.index();

    $el.addClass("selected");
    $li.addClass("active");


    this._checkOptions();
  },


  _checkOptions: function() {
    if (this.option == 2) {
      this.$el.find("a.ok").removeClass("disabled")
    } else {
      this.$el.find("a.ok").addClass("disabled")
    }
  },


  ok: function(ev) {
    ev.preventDefault();

    if (this.option == 2 && this.active == true ) {
      
      this.options.tables.bind("add", function(m) {
          console.log(m);
        },this);

      this.options.tables.create();
    }
  },


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
  },


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
  }
})
