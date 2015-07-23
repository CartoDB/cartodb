
  /**
   *  New geocoding dialog
   *
   *  - It only needs a table and a user models.
   *
   */

  cdb.admin.GeocodingDialog = cdb.common.CreateDialog.extend({

    _TEXTS: {
      title:  _t('Select your desired type of georeferenciation'),
      ok:     _t('Continue')
    },


    // Default options
    options: {
      tabs:   ['lonlat', 'city', 'admin', 'postal', 'ip', 'address'],
      option: 'lonlat'
    },

    initialize: function() {
      var self = this;

      // Populate variables
      this.tabs = this.options.tabs;
      this.user = this.options.user;
      this.table = this.options.table;
      this.options.states = this.options.states || cdb.common.CreateDialog.states;

      // Dialog model
      this.model = new cdb.admin.GeocodingDialog.Model();

      // Extend options
      _.extend(this.options, {
        title:              this._TEXTS.title,
        description:        '',
        template_name:      'table/views/geocoding_dialog/geocoding_dialog_base',
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
        user:     this.user,
        tabs:     this.tabs,
        states:   this.options.states,
        option:   this.options.option,
        table:    this.table,
        $dialog:  this.$el,
        template: 'table/views/geocoding_dialog/geocoding_dialog_content'
      });

      content.bind('geocodingChosen', this._onGeocodingChosen, this);
      this.$('.content').append(content.render().el);

      content.bind('changeSize', function() {
        setTimeout(function() {
          self.centerInScreen(true);
        }, 300);
      }, this);

      this.addView(content);
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


    _onGeocodingChosen: function() {
      // Generate and clean returning geocoding object
      var obj = _.extend(
        _.clone(this.model.get('geocoding')),
        {
          type:       this.model.get('option'),
          table_name: this.table.get('id')
        }
      );

      // Remove non necessary attributes
      obj = _.omit(obj, 'step', 'valid', 'agreement');

      // Check if location is empty, in that case, let's take "world" as location
      var isWorld = ( obj.location === "" || ( obj.text && obj.location.search('world') !== -1 ));
      if (isWorld) {
          // Set world as selected and free text
        obj.location = "world";
        obj.text = true;
      }

      // Check if type is admin and world as location
      if (obj.kind === "admin1" && isWorld) {
        // Change kind to admin0
        obj.kind = "admin0";
      }

      cdb.god.trigger('geocodingChosen', obj);
      this.hide();
    },

    ///////////////////////////////
    // Dialog visibility methods //
    ///////////////////////////////

    // Close the dialog only if state is error or idle
    _keydown: function(e) {
      if (e.keyCode === 27) {
        this.hide();
      }
    },

    hide: function() {
      this.trigger("closedDialog", this);
      cdb.common.CreateDialog.prototype.hide.call(this);
    },

    // Ok button will appear in each panel, not in the dialog
    _ok: function(e) {},

    // True cleanning
    clean: function() {
      // Remove keydown binding
      $(document).unbind('keydown', this._keydown);
      cdb.common.CreateDialog.prototype.clean.call(this);
    }
  });
