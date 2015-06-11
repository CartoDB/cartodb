
  /*
   *  Dialog where import files and create new table or visualization
   *  into CartoDB editor, it should be:
   *
   *
   *  new cdb.common.CreateDialog({
   *    user:     user_model,
   *    data:     { url: ?, file: ? },
   *    tabs:     ['scratch', 'file', 'twitter', 'gdrive', 'dropbox', 'layer', ...],
   *    option:   'tab-name',
   *    states:   {}, // (optional)
   *    uploader: { url: '', maxFileSize: 1, ... },
   *    where:    'visualization' | 'table'
   *  });
   *
   *
   *  - user: A user model, to check remaining quota, if user can sync table,... etc.
   *  - data: You can attach any file (from mamufas) or an url (for example from common data).
   *  - tabs: Option tabs, added as a string.
   *  - option: Tab to open from the beginning.
   *  - states: UI changes depending the state and option.
   *  - uploader: options for upload purposes.
   *  - where: Where dialog is opened, from visualizations or tables section.
   *
   *  - It will create a model to control the state of the dialog:
   *   · State: what is doing the dialog -> (idle, uploading, importing or error)
   *   · Option: option clicked -> (file or scratch, for the moment)
   *
   */


  cdb.common.CreateDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:  _t('Select the source to import new data'),
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

    // Default options
    options: {
      tabs:   ['file', 'gdrive', 'dropbox', 'twitter', 'scratch', 'success', 'error'],
      option: 'file',
      where:  'table'
    },

    initialize: function() {
      var self = this;

      // Populate variables
      this.tabs = this.options.tabs;
      this.user = this.options.user;
      this.options.states = this.options.states || cdb.common.CreateDialog.states;

      // Dialog model
      this.model = new cdb.common.CreateDialog.Model();

      // Set user limits
      this._setUserLimits();

      // Extend options
      var upgrade_url = window.location.protocol + '//' + cdb.config.get('account_host') + "/account/" + this.user.get('username') + "/upgrade";
      var can_trial = this.user.get('show_upgrade_message') && this.user.get('acount_type').toLowerCase() === "free";

      _.extend(this.options, {
        title:              this._TEXTS.title,
        description:        '',
        template_name:      'old_common/views/create_dialog/create_dialog_base',
        clean_on_hide:      true,
        ok_button_classes:  "button green disabled",
        ok_title:           this._TEXTS.ok,
        modal_type:         "create-dialog",
        width:              585,
        can_trial:          can_trial,
        upgrade_url:        upgrade_url
      });

      cdb.admin.BaseDialog.prototype.initialize.apply(this);

      // Check data after some time
      setTimeout(function() {
        self._checkData()
      }, 100);
    },

    render_content: function() {

      var self = this;

      // Render option tabs content (tabs and panes)
      var content = new cdb.common.CreateDialog.Content({
        model:    this.model,
        user:     this.options.user,
        tabs:     this.options.tabs,
        states:   this.options.states,
        option:   this.options.option,
        uploader: this._UPLOADER,
        $dialog:  this.$el
      });

      this.$('.content').append(content.render().el);

      content.bind('showUpgrade', this._showUpgrade, this);
      content.bind('changeSize', function() {
        setTimeout(function() {
          self.centerInScreen(true);
        }, 300);

      }, this);

      this.addView(content);

      // Render uploader
      var uploader = new cdb.common.CreateDialog.Uploader({
        model:    this.model,
        user:     this.options.user,
        uploader: this._UPLOADER
      });
      this.$('.content').append(uploader.render().el);
      uploader.bind('creationComplete', this._onCreationComplete, this);
      this.addView(uploader);
    },

    centerInScreen: function() {

      var marginTop = this.$(".modal").height()/2;

      this.$(".modal")
      .animate({
        top:        "50%",
        marginTop: -marginTop
      }, 150);

    },

    _setUserLimits: function() {
      // Any uploader option coming from dialog options?
      // It could be overwritten if it is needed
      if (this.options.uploader) {
        this._UPLOADER = _.extend(this._UPLOADER, this.options.uploader);
      }

      // Size quota remaining
      if (!_.isNull(this.user.get('remaining_byte_quota'))) {
        this._UPLOADER.maxFileSize = this.user.get("remaining_byte_quota") * ( this.user.get("actions").import_quota || 1 );
      }

      // Remaining table quota
      if (!_.isNull(this.user.get('remaining_table_quota'))) {
        this._UPLOADER.remainingQuota = (_.isNull(this.user.get("remaining_table_quota")) || this.user.get("remaining_table_quota") > 0)
      }

      // Sync tables?
      if (!_.isNull(this.user.get('actions')) && this.user.get('actions').sync_tables) {
        this._UPLOADER.acceptSync = this.user.get('actions').sync_tables;
      }
    },

    // Check if there was any data included
    _checkData: function() {
      if (!_.isEmpty(this.options.data)) {
        var d = this.options.data;

        this.model.set({
          state:  'added',
          option: 'file',
          upload: {
            type:     d.files ? 'file' : 'url',
            value:    d.files && d.files[0] || d.url,
            valid:    true,
            interval: 0,
            progress: 0
          }
        });
      }
    },


    ///////////////////////////////
    // Dialog visibility methods //
    ///////////////////////////////

    _onCreationComplete: function() {
      this.trigger('importCompleted', this.model.get('upload'), this)
    },

    _onCreationDone: function() {
      this.trigger('importDone', this.model.get('upload'), this)
    },

    _showUpgrade: function() {
      this.trigger('showUpgrade', this);
      this.hide();
    },

    // Close the dialog only if state is error or idle
    _keydown: function(e) {
      var valid_states = ['idle', 'reset', 'abort', 'added', 'error'];
      var current_state = this.model.get('state');
      
      if (e.keyCode === 27 && _.contains(valid_states, current_state)) {
        this.hide();
      }
    },

    hide: function() {
      this.trigger("closedDialog", this);
      cdb.admin.BaseDialog.prototype.hide.call(this);
    },

    // Click over the OK button
    _ok: function(e) {
      if (e) this.killEvent(e);

      var state = this.model.get('state');
      var option = this.model.get('option');
      var isValid = this.model.get('upload').valid;

      // Let's surf in the options

      switch (state) {
        case 'idle':
        case 'abort':
        case 'reset':
          if (isValid) {
            // If it is the layer option
            // don't selected and complete the
            // process
            if (option === "layer") {
              this._onCreationComplete()
            } else {
              this.model.set('state', 'selected')  
            }
          }
          break;
        case 'enqueued':
        case 'pending':
        case 'importing':
        case 'uploading':
        case 'unpacking':
          this.trigger('importStarted', this.model.get('upload'), this);
          break;
        case 'getting':
        case 'creating':
          break;
        case 'complete':
          this._onCreationDone();
          break;
        case 'error':
          this.hide();
          break;
        default:
          cdb.log.info(state + " state not listed");
      }
    },

    // True cleanning
    clean: function() {
      // Remove keydown binding
      $(document).unbind('keydown', this._keydown);

      cdb.admin.BaseDialog.prototype.clean.call(this);
    }
  });
