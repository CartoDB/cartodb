
  /**
   *  Create dialog uploader
   *
   *  - It will manage a new table creation, no matter if it is
   *  from a url, file, service, etc.
   *
   *
   *  cdb.common.CreateDialog.Uploader({
   *    model:    creation_model,
   *    user:     user_model,
   *    uploader: uploader_options
   *  });
   *
   */


  cdb.common.CreateDialog.Uploader = cdb.core.View.extend({


    initialize: function() {
      this.uploader_options = this.options.uploader;
      this.user = this.options.user;

      this.template = cdb.templates.getTemplate(this.options.template || 'old_common/views/create_dialog/create_dialog_uploader');

      this._initBinds();
    },

    render: function() {
      this.$el.append(this.template());

      // Create fileupload
      this._createUploader();

      return this;
    },

    _initBinds: function() {
      _.bindAll(this, "_onUploadProgress", "_onUploadStart", "_onUploadAbort",
        "_onUploadAdd", "_onUploadComplete", "_onUploadError", "_onImportError");

      // Any state change, 
      this.model.bind('change:state', this._manageUpload, this);
    },


    //////////////////////
    // Upload processes //
    //////////////////////

    _createUploader: function() {
      // Create the fileupload
      this.$upload = this.$("form.create-dialog-uploader");
      this.$upload.fileupload({
        // It is not possible to disable dropzone.
        // So, dropzone element doesn't exist, :)
        dropZone:               this.$('.non-dropzone'),
        url:                    cdb.config.prefixUrl() + this.uploader_options.url,
        paramName:              'filename',
        formData:               this._formData,
        progressInterval:       100,
        bitrateInterval:        500,
        maxFileSize:            this.uploader_options.maxFileSize,
        autoUpload:             true,
        limitMultiFileUploads:  this.uploader_options.maxUploadFiles,
        limitConcurrentUploads: this.uploader_options.maxUploadFiles,
        acceptFileTypes:        this._setValidFileExtensions(this.uploader_options.acceptFileTypes),
        add:                    this._onUploadAdd,
        progress:               this._onUploadProgress,
        start:                  this._onUploadStart,
        done:                   this._onUploadComplete,
        fail:                   this._onUploadError
      });

      // Set uploader widget
      this.uploader = this.$upload.data('fileupload');
    },

    // It will decide what to do depending
    // the model state
    _manageUpload: function(m, state, c) {
      // Value selected? Let's go!
      if (state === "selected") {

        // File?
        if (this.model.get('upload').type === 'file') {
          this.$upload.fileupload('add', {
            files: this.model.get('upload').value
          });

          return false;
        }

        // Url or service?
        if (this.model.get('upload').type === 'url' || this.model.get('upload').type === 'service' ) {
          var d = this._generateImportData();
          this[ this.model.get('upload').interval > 0 ? '_createSync' : '_createImport'](d);
          return false;
        }

        // Empty?
        if (this.model.get('upload').type === "empty") {
          this._createTable();
          return false;
        }

        // Ouch!
        cdb.log.info('Import type ' + this.model.get('upload').type + ' is not defined!')
      }

      // Cancel cancel!
      if (state === "abort") {
        this._onUploadAbort();
      }
      
    },

    // When an upload starsts
    _onUploadStart: function(e, data) {
      // Setting state
      this.model.set('state', 'getting');
    },

    // Change progress of a file
    _onUploadProgress: function(e, data) {
      var loaded = data.loaded
      var total = data.total;
      // We need to clone the upload object if not backbone won't trigger
      // the change event and progress bar won't change
      var upload = _.clone(this.model.get('upload'));

      // Get progress
      upload['progress'] = (loaded / total) * 100;
      // Set model
      this.model.set('upload', upload)
    },

    // If user cancels an upload
    _onUploadAbort: function(e) {
      this.model.set('state', 'abort');

      if (e) e.preventDefault();
      this.jqXHR.abort();
    },

    // If upload fails
    _onUploadError: function(e, data) {

      var error_message;

      if (data && data.jqXHR && data.jqXHR.status === 429) {
        var message = JSON.parse(data.jqXHR.responseText);
        error_message = message.errors.imports;
      }

      this._onImportError(null, error_message);
    },

    // Upload complete, YAY!
    _onUploadComplete: function(e, data) {
      var upload = _.extend(
        this.model.get('upload'),{
          item_queue_id: data.result.item_queue_id
        }
      );

      this.model.set({
        upload: upload
      });

      // Start checking import!
      this._checkImport();
    },

    // When a file is added, start the upload
    _onUploadAdd: function(e, data) {
      if (data.originalFiles.length === 1) {
        this.jqXHR = data.submit();
      }
    },

    _formData: function(form) {
      return [{ name: 'content_guessing', value: true }];
    },


    /////////////////
    // Upload help //
    /////////////////

    _setValidFileExtensions: function(list) {
      return RegExp("(\.|\/)(" + list.join('|') + ")$", "i");
    },


    ////////////////////
    // Import process //
    ////////////////////

    _generateImportData: function() {
      var d = {
        content_guessing: true,
        interval:         this.model.get('upload').interval
      };
      var type = this.model.get('upload').type;
      var option = this.model.get('option');

      // Url?
      if (type === "url") {
        _.extend(d, {
          url: this.model.get('upload').value
        });
      }

      // Service?
      if (type === "service" ) {
        // If service is Twitter, service_item_id should be
        // sent stringified
        var service_item_id = (option === "twitter")
            ? JSON.stringify(this.model.get('upload').service_item_id)
            : this.model.get('upload').service_item_id;

        _.extend(d, {
          value:            this.model.get('upload').value,
          service_name:     this.model.get('upload').service_name,
          service_item_id:  service_item_id
        });
      }

      return d;
    },

    // Create sync table before checking import
    _createSync: function(d) {
      var self = this;

      // Create synchronization model if it is
      // necessary
      var sync = new cdb.admin.TableSynchronization(d);

      sync.save(null, {
        success: function(m) {

          var upload = _.extend(
            self.model.get('upload'),
            m.get('data_import')
          );

          self.model.set('upload', upload);
          self._checkImport();
        },
        error: this._onImportError
      });
    },

    // Create import to take item_queue_id
    // and start checking if it is finished
    // or not...
    _createImport: function(d) {
      var self = this;
      var imp = new cdb.admin.Imports(d);

      imp.save(null, {
        success: function(mdl, r) {

          var upload = _.extend(
            self.model.get('upload'),{
              item_queue_id: r.item_queue_id
            }
          );
          self.model.set('upload', upload);
          self._checkImport();
        },
        error: this._onImportError
      });
    },

    // Check import state
    _checkImport: function() {
      if (!this.model.get('upload').item_queue_id) {
        cdb.log.info('No item queue id is defined for importing');
        return false;
      }

      var self = this;

      // Setting state
      this.model.set('state', 'uploading');

      // Destroy previous importation if exists.
      if (this.importation){
        this.importation.unbind();
        this.importation.destroyCheck();
      }

      // Generate new one
      var imp = this.importation = new cdb.admin.Import({
        item_queue_id: this.model.get('upload').item_queue_id
      });

      // Set url root for import model if exists
      if (this.model.get('upload').endpoint)
        imp.setUrlRoot(this.model.get('upload').endpoint)

      // Bind import changes
      imp.bind("importComplete",  this._onImportComplete, this)
      imp.bind("importError",     this._onImportError,    this);
      imp.bind("importChange",    this._onImportChange,   this);

      // Start polling
      imp.pollCheck();
    },

    _onImportComplete: function(m) {
      m.unbind();

      // Checking if there was a problem with 
      // null ids issue
      if (!m.get('table_name')) {
        cdb.log.error('Table creation/importation is returning null ids');
        this._onImportError(m);
      } else {

        var upload        = this.model.get('upload');
        upload.table_name = m.get('table_name');

        if (m.get('tables_created_count') && m.get('tables_created_count') > 1) {
          upload.tables_created_count = m.get('tables_created_count');
        }

        // Twitter import attributes
        if (m.get("tweets_cost"))          upload.tweets_cost          = m.get("tweets_cost");
        if (m.get("tweets_georeferenced")) upload.tweets_georeferenced = m.get("tweets_georeferenced");
        if (m.get("tweets_overquota"))     upload.tweets_overquota     = m.get("tweets_overquota");

        // Get used tweets if service name was twitter_search
        if (this.model.get('upload').service_name === "twitter_search") {
          upload.tweets_left = Math.max(
            0,
            this.options.user.get('twitter').quota - ( this.options.user.get('twitter').monthly_use + ( upload.tweets_georeferenced || 0 ))
          );
        }

        // Raster import?
        if (m.get("any_table_raster")) {
          upload.any_table_raster = true;
        }

        this.model.set({
          state: 'complete',
          upload: upload
        });

        // Send complete trigger
        this.trigger('creationComplete');
      }
    },

    _onImportError: function(m, custom_error_message) {
      // Remove bindings if it is possible
      m && m.unbind && m.unbind();

      var upload = this.model.get('upload');
      var error = {};

      // Set item_queue_id?
      if (m && m.get && m.get('item_queue_id')) {
        upload.item_queue_id = m.get('item_queue_id');
      }

      // Set error codes and messages
      if (m && m.get && m.get('error_code')) {
        error.error_code = m.get('error_code');
      }

      if (m && m.get && m.get('get_error_text')) {
        error.title = m.get('get_error_text').title;
        error.what_about = m.get('get_error_text').what_about;
      }

      if (custom_error_message) {
        error = { what_about: custom_error_message };
      }

      // Set state :(
      this.model.set({
        state:  'error',
        option: 'error',
        upload: upload,
        error:  error
      });
    },

    _onImportChange: function(m) {
      this.model.set('state', m.get('state'));
    },


    //////////////////
    // Create table //
    //////////////////

    _createTable: function() {
      var self = this;
      var table = new cdb.admin.CartoDBTableMetadata();

      this.model.set('state', 'creating');

      table.save({}, {
        success: function(m) {
          var upload = self.model.get('upload');
          upload.table_name = m.get('name');
          
          self.model.set({
            state: 'complete',
            upload: upload
          });

          self.trigger('creationComplete');
        },
        error: function(m, e) {
          var error = {
            code:           m && m.get('error_code'),
            title:          m && m.get('get_error_text') && m.get('get_error_text').title,
            about:          m && m.get('get_error_text') && m.get('get_error_text').what_about,
            item_queue_id:  m && m.get('item_queue_id')
          }

          if (e && e.responseText) {
            var obj = JSON.parse(arguments[1].responseText);
            if (obj && obj.errors && obj.errors[0]) error.title = obj.errors[0];
          }

          self.model.set({
            state: 'error',
            error: error
          });
        }
      });

      // Setting state
      this.model.set('state', 'creating');
    },


    clean: function() {
      // Remove current importation if is working
      if (this.importation){
        this.importation.unbind();
        this.importation.destroyCheck();
      }

      // Destroy fileupload
      this.$upload.fileupload("destroy");

      // Cancel upload in case there is one active
      if (this.jqXHR) this._onUploadAbort();

      cdb.core.View.prototype.clean.call(this);
    }

  });
