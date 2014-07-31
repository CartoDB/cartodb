
  /*
   *  Dialog where import files and create new table or visualization
   *  into CartoDB editor, it should be:
   *
   *
   *  new cdb.common.CreateDialog({
   *    user:   user_model,
   *    data:   { url: ?, file: ? },
   *    tabs:   ['scratch', 'file', 'twitter', 'gdrive', 'dropbox', 'layer', ...],
   *    option: 'tab-name',
   *    where:  'visualization' | 'table'
   *  });
   *
   *
   *  - A user model, to check remaining quota, if user can sync table,... etc.
   *  - Data: You can attach any file (from mamufas) or an url (for example from common data).
   *  - Option tabs, added as a string.
   *  - Tab to open from the beginning.
   *  - Where dialog is opened, from visualizations or tables section.
   *
   *  - It will create a model to control the state of the dialog:
   *   · State: what is doing the dialog -> (idle, uploading, importing or error)
   *   · Option: option clicked -> (file or scratch, for the moment)
   *
   *
   */


  cdb.common.CreateDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:  _t('Select how you want to import new data'),
      ok:     _t('Create table')
    },

    _UPLOADER: {
      url:              '/api/v1/imports',
      maxFileSize:      100000000,
      maxUploadFiles:   1,
      acceptFileTypes:  ['csv','xls','xlsx','zip','kml','geojson','json','ods','kmz','tsv',
                         'gpx','tar','gz','tgz','osm','bz2','tif','tiff','txt','sql'],
      acceptSync:       false
    },

    initialize: function() {
      // Populate variables
      this.tabs = this.options.tabs;

      // Dialog model
      this.model = new cdb.core.Model({
        option: 'file',
        state:  'idle'
      });

      // Extend options
      _.extend(this.options, {
        title:              this._TEXTS.title,
        description:        '',
        template_name:      'common/views/create_dialog/create_dialog_base',
        clean_on_hide:      true,
        ok_button_classes:  "button green disabled",
        ok_title:           this._TEXTS.ok,
        modal_type:         "creation",
        width:              565
      });

      // Super!
      this.constructor.__super__.initialize.apply(this);
    },

    render: function() {
      this.$el.html(this.template_base(this.options));

      this.$(".modal").css({ width: this.options.width });

      if (this.render_content) {
        this.$('.content').append(this.render_content());
      }

      if (this.options.modal_class) {
        this.$el.addClass(this.options.modal_class);
      }

      return this;
    },

    render_content: function() {
      
    },

    // Click over the OK button
    _ok: function(ev) {
      if (ev) ev.preventDefault();

    },

    // True cleanning
    clean: function() {
      // Destroy fileupload
      // this.$upload.fileupload("destroy");

      // // Remove keydown binding
      // $(document).unbind('keydown', this._keydown);

      // // Cancel upload in case there is one active
      // if (this.jqXHR) this._onUploadAbort();

      cdb.admin.BaseDialog.prototype.clean.call(this);
    }
  });
