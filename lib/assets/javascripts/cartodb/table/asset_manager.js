

  cdb.admin.AssetManager = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:  _t('Select a marker image'),
      ok:     _t('Set image')
    },

    _UPLOADER: {
      url:              '/api/v1/users/<%= id %>/assets',
      uploads:          1, // Max uploads at the same time
      maxFileSize:      100000, // 1mb?
      acceptFileTypes:  /(\.|\/)(png|jpg?e|zip|kml|geojson|json|ods|kmz|gpx|tar|gz|tgz|osm|bz2|tif|tiff|txt)$/i
    }

    events: function(){
      return _.extend({},cdb.admin.BaseDialog.prototype.events,{ });
    },

    initialize: function() {
      _.extend(this.options, {
        title: this._TEXTS.title,
        description: '',
        template_name: 'common/views/dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey disabled",
        cancel_button_classes: "hide",
        ok_title: this._TEXTS.ok,
        modal_type: "creation",
        width: 600
      });
      this.constructor.__super__.initialize.apply(this);
      this.user = this.options.user;
    },

    // render_content: function() {
    //   var $content = $('<div>');
    //   var content = this.getTemplate('table/views/asset_manager');

    //   // Render file tabs
    //   this.render_panes($content);

    //   // 

    //   // Add the content to the dialog
    //   $content.append(temp_content());




    //   // Save references
    //   this.$loader      = $content.find("div.progress");
    //   this.$list        = $content.find("ul.options");
    //   this.$import      = $content.find("div.upload");
    //   this.$holder      = $content.find("div.holder");
    //   this.$error       = this.$el.find("section.modal.error");
    //   this.$importation = this.$el.find("section.modal:eq(0)");
      

    //   // Hide error... for the moment
    //   this.$error.hide();

    //   console.log(this.options.user);
    //   console.log(new cdb.admin.Assets({ user: this.options.user }).fetch());
      

    //   return $content;
    // },

    // render_panes: function($content) {
    //   this.$panes = $content.find(".panes");

    //   this.tabs = new cdb.admin.Tabs({
    //     el: $content.find('.dialog-tabs')
    //   });
    //   this.addView(this.tabs);

    //   this.filePane = new cdb.admin.ImportPane({
    //     template: cdb.templates.getTemplate('common/views/import_file')
    //   });
    //   this.addView(this.filePane);

    //   this.gdrivePane = new cdb.admin.ImportPane({
    //     template: cdb.templates.getTemplate('common/views/import_gdrive')
    //   });
    //   this.addView(this.gdrivePane);

    //   this.dropboxPane = new cdb.admin.ImportPane({
    //     template: cdb.templates.getTemplate('common/views/import_dropbox')
    //   });
    //   this.addView(this.dropboxPane);

    //   this.panes = new cdb.ui.common.TabPane({
    //     el: this.$panes
    //   });
    //   this.panes.addTab('file', this.filePane);
    //   this.panes.addTab('gdrive', this.gdrivePane);
    //   this.panes.addTab('dropbox', this.dropboxPane);
    //   this.panes.active('file');
    //   this.addView(this.panes);

    //   this.tabs.linkToPanel(this.panes);

    //   // Finally adding the views to the content
    //   $content.append(this.panes.render());
    // },

    // // Create the fileupload
    // init_uploader: function($content) {
    //   var $upload = this.$upload = $content.find("form");
    //   $upload.fileupload({
    //     dropZone: $upload,
    //     url: _.template(this._UPLOADER.url)(this.user),
    //     paramName: 'filename',
    //     progressInterval: 100,
    //     bitrateInterval: 500,
    //     maxFileSize: this._UPLOADER.maxFileSize,
    //     autoUpload: true,
    //     limitMultiFileUploads: this._UPLOADER.uploads,
    //     limitConcurrentUploads: this._UPLOADER.uploads,
    //     add: this._onUploadAdd,
    //     acceptFileTypes: this.options.acceptFileTypes,
    //     drop: this._onDrop,
    //     dragover: this._onDragOver,
    //     progress: this._onUploadProgress,
    //     start: this._onUploadStart,
    //     done: this._onUploadComplete,
    //     fail: this._onUploadError
    //   });

    //   // Bind mouse leave when drop is out of upload form
    //   $upload.bind("mouseleave",function() {
    //     $(this).removeClass("drop");
    //   });
    // },


    // // Visibility functions

    // _showLoader: function() {
    //   this.$('.loader').fadeIn();
    // },

    // _hideLoader: function() {
    //   this.$('.loader').fadeOut();
    // }


  })