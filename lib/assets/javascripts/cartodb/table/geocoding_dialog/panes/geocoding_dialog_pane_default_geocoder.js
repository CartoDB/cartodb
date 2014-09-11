
  /**
   *  Default pane for "our magic geocoder" (named places, regions, postal codes)
   *
   *  - It needs a table model, the countries collection
   *    and the data from all countries (about postal codes).
   *  - It extends from the default pane.
   *
   */
  

  cdb.admin.GeocodingDialog.Pane.DefaultGeocoder = cdb.admin.GeocodingDialog.Pane.extend({

    className: 'geocoding-pane-default geocoding-pane-default-geocoder',

    events: {
      'click a.back': '_onBackClick',
      'click a.ok': '_onOkClick'
    },

    _TEXTS: {
      placeholder: {
        column:  _t('Select the column(s)'),
        disabled: _t('Getting countries...'),
        country:  _t('Select the country')
      },
      error: _t('You must select at least one column.')
    },

    initialize: function() {
      this.table = this.options.table;
      this.countries_data = this.options.countries_data;

      this.model = new cdb.admin.GeocodingDialog.Pane.Model({
        valid:          false,
        column_name:    "",
        country_code:   "",
        geometry_type:  "",
        kind:           this.options.kind || "anytype",
        step:           0
      });

      this.template = cdb.templates.getTemplate(this.options.template || 'table/views/geocoding_dialog/geocoding_dialog_pane_default_geocoder');
      this._initBinds();
    },

    _initBinds: function() {
      _.bindAll(this, '_onBackClick', '_onOkClick');

      this.model.bind('change',       this._onModelChange, this);
      this.model.bind('change',       this._checkOkButton, this);
      this.model.bind('change:step',  this._onChangeStep, this)
      
      this.countries_data.bind('reset', this.render, this);
      this.add_related_model(this.countries_data);
    },

    _initViews: function() {
      var self = this;

      // Columns
      var columns = new cdb.forms.Combo({
        model:        this.model,
        property:     'column_name',
        width:        '162px',
        placeholder:  this._TEXTS.placeholder.column,
        extra:        this._getTableColumns()
      });

      this.addView(columns);
      this.$(".geocoding-pane-select.kind").append(columns.render().el);

      // Countries
      this.contries_combo = new cdb.forms.Combo({
        model:        this.model,
        property:     'country_code',
        width:        '162px',
        disabled:     this.countries_data.size() > 0 ? false : true,
        placeholder:  this.countries_data.size() > 0 ? this._TEXTS.placeholder.country : this._TEXTS.placeholder.disabled,
        extra:        this._getCountries()
      });

      this.addView(this.contries_combo);
      this.$(".geocoding-pane-select.country").append(this.contries_combo.render().el);

      // Error tab
      this.pane_info = new cdb.admin.ImportInfo({
        el:    this.$('div.infobox'),
        model: this.model
      });
      this.addView(this.pane_info);

      // Geocoder styles
      this.geocoder_styles = new cdb.admin.GeocodingDialog.Content.Styles({
        model:          this.model,
        countries_data: this.countries_data
      });

      this.addView(this.geocoder_styles);
      this.$(".geocoding-pane-step.second").append(this.geocoder_styles.render().el);
    },

    _getCountries: function() {
      if (this.countries_data.size() > 0) {
        return this.countries_data.map(function(c,i) {
          return c.get('country')
        })
      } else {
        return [];
      }
    },

    _onModelChange: function() {
      var isValid = this.model.get('column_name') && this.model.get('country_code') && this.model.get('geometry_type');
      this.model.set('valid', isValid ? true : false);
    },

    _onChangeStep: function() {
      var step = this.model.get('step');
      
      // Change pane height
      this._changePaneHeight(250);
      
      // Show back button
      this.$('a.back')[ step === 0 ? 'hide' : 'show' ]();

      // Move wrapper
      var pos = this.$('.geocoding-pane-step.second').position();

      if (pos && pos.left) {
        var left = pos.left;
        this.$('.geocoding-pane-content-wrapper')
          .animate({
            'margin-left': step === 0 ? 0 : ( -left + 40 /* the margin between elements */ ) 
          }, {
            duration: 350,
            queue: false
          });

        // Move dialog
        this.trigger("changeSize", this);
      }
    },

    // Change pane height
    _changePaneHeight: function(duration) {
      var step = this.model.get('step');
      var height = step === 0
        ? this.$('.geocoding-pane-step.first').height()
        : this.$('.geocoding-pane-step.second').height();
      
      this.$('.geocoding-pane-content').animate({
        'height': height
      },{
        duration: duration || 0,
        queue: false
      });
    },

    _checkOkButton: function() {
      var enabled = this.model.get('column_name') && this.model.get('country_code');
      this.$('a.ok')[ enabled ? 'removeClass' : 'addClass' ]('disabled');
    },

    _onBackClick: function(e) {
      if (e) this.killEvent(e);
      
      this.model.set({
        geometry_type:  '',
        step:           0
      })
    },

    setActive: function() {
      this._changePaneHeight(0);
    },

    _onOkClick: function(e) {
      if (e) this.killEvent(e);

      if (this.model.get('column_name') && this.model.get('country_code')) {
        var step = this.model.get('step');

        if (step === 0) {
          this.model.set('step', 1);
        } else if (this.model.get('geometry_type')) {
          this.trigger('geocodingChosen', this.model.attributes, this);
        }

        this.pane_info.hideTab();
      } else {
        var self = this;

        this.pane_info.activeTab('error', this._TEXTS.error );
        
        // Resize!
        setTimeout(function(){
          self._changePaneHeight(0);
        },400);
      }
    }    

  });