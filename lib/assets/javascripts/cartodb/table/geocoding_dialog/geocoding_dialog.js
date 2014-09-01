
  /**
   *  Geocoding dialog 
   *
   *
   */
  
  cdb.admin.GeocodingDialog = cdb.common.CreateDialog.extend({

    _TEXTS: {
      title:  _t('Select your desired type of georeferenciation'),
      ok:     _t('Georeference')
    },


    // Default options
    options: {
      tabs:   ['latlng', 'city', 'admin', 'postal', 'ip', 'address', 'error'],
      option: 'latlng',
      where:  'table'
    },

    initialize: function() {
      var self = this;

      // Populate variables
      this.tabs = this.options.tabs;
      this.user = this.options.user;
      this.options.states = this.options.states || cdb.common.CreateDialog.states;

      // Dialog model
      this.model = new cdb.admin.GeocodingDialog.Model();

      // Extend options
      _.extend(this.options, {
        title:              this._TEXTS.title,
        description:        '',
        template_name:      'common/views/create_dialog/create_dialog_base',
        clean_on_hide:      true,
        ok_button_classes:  "button grey disabled",
        ok_title:           this._TEXTS.ok,
        modal_type:         "create-dialog geocoding-dialog",
        width:              605,
        can_trial:          false
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
      var content = new cdb.admin.GeocodingDialog.Content({
        model:    this.model,
        user:     this.options.user,
        tabs:     this.options.tabs,
        states:   this.options.states,
        option:   this.options.option,
        table:    this.options.table,
        $dialog:  this.$el
      });

      this.$('.content').append(content.render().el);

      content.bind('changeSize', function() {
        setTimeout(function() {
          self.centerInScreen(true);
        }, 300);

      }, this);

      this.addView(content);

      // Render uploader
      // var uploader = new cdb.common.CreateDialog.Uploader({
      //   model:    this.model,
      //   user:     this.options.user,
      //   uploader: this._UPLOADER
      // })
      // this.$('.content').append(uploader.render().el);
      // uploader.bind('creationComplete', this._onCreationComplete, this);
      // this.addView(uploader);
    },


    // Check if there was any data included
    _checkData: function() {
      if (!_.isEmpty(this.options.data)) {
        var d = this.options.data;

        this.model.set({
          state:  'selected',
          option: 'lonlat',
          geocoding: {
            longitude:  this.options.data.longitude || '',
            latitude:   this.options.data.latitude || '',
            valid:      this.options.data.longitude && this.options.data.latitude ? true : false
          }
        });
      }
    },


    ///////////////////////////////
    // Dialog visibility methods //
    ///////////////////////////////

    // _onCreationComplete: function() {
    //   this.trigger('importCompleted', this.model.get('upload'), this)
    // },

    // _onCreationDone: function() {
    //   this.trigger('importDone', this.model.get('upload'), this)
    // },

    // _showUpgrade: function() {
    //   this.trigger('showUpgrade', this);
    //   this.hide();
    // },

    // Close the dialog only if state is error or idle
    _keydown: function(e) {
      // var valid_states = ['idle', 'reset', 'abort', 'added', 'error'];
      // var current_state = this.model.get('state');
      
      // if (e.keyCode === 27 && _.contains(valid_states, current_state)) {
      //   this.hide();
      // }
    },

    hide: function() {
      this.trigger("closedDialog", this);
      cdb.common.CreateDialog.prototype.hide.call(this);
    },

    // Click over the OK button
    _ok: function(e) {
      if (e) this.killEvent(e);

      // var state = this.model.get('state');
      // var option = this.model.get('option');
      // var isValid = this.model.get('upload').valid;

      // // Let's surf in the options

      // switch (state) {
      //   case 'idle':
      //   case 'abort':
      //   case 'reset':
      //     if (isValid) {
      //       // If it is the layer option
      //       // don't selected and complete the
      //       // process
      //       if (option === "layer") {
      //         this._onCreationComplete()
      //       } else {
      //         this.model.set('state', 'selected')  
      //       }
      //     }
      //     break;
      //   case 'importing':
      //   case 'uploading':
      //   case 'unpacking':
      //     this.trigger('importStarted', this.model.get('upload'), this);
      //     break;
      //   case 'getting':
      //   case 'creating':
      //     break;
      //   case 'complete':
      //     this._onCreationDone();
      //     break;
      //   case 'error':
      //     this.hide();
      //     break;
      //   default:
      //     cdb.log.info(state + " state not listed");
      // }
    },

    // True cleanning
    clean: function() {
      // Remove keydown binding
      $(document).unbind('keydown', this._keydown);
      cdb.common.CreateDialog.prototype.clean.call(this);
    }
  });
