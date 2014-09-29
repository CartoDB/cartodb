
  /**
   *  Pane to set longitude and latitude columns
   *  in the geocoding dialog.
   *
   *  - It needs a table model, if not it won't be able
   *    to know table columns to complete longitude and
   *    latitude options.
   *
   */
  

  cdb.admin.GeocodingDialog.Pane.LonLat = cdb.admin.GeocodingDialog.Pane.extend({

    className: 'geocoding-pane-lonlat',

    _TEXTS: {
      placeholder:  _t('Select the column(s)'),
      error:        _t('You have to select longitude and latitude')
    },

    initialize: function() {
      this.table = this.options.table;
      this.model = new cdb.admin.GeocodingDialog.Pane.Model({
        valid:      false,
        longitude:  '',
        latitude:   ''
      });
      this.template = cdb.templates.getTemplate(this.options.template || 'table/views/geocoding_dialog/geocoding_dialog_pane_lonlat');
      this._initBinds();
    },

    _initBinds: function() {
      _.bindAll(this, '_onOkClick');
      this.model.bind('change:latitude change:longitude', this._onModelChange, this);
      this.model.bind('change:valid',                     this._onValidChange, this);
    },

    _initViews: function() {
      // Latitude
      var latitude = new cdb.forms.Combo({
        model:        this.model,
        property:     'latitude',
        width:        '220px',
        placeholder:  this._TEXTS.placeholder,
        extra:        this._getTableColumns()
      });

      this.addView(latitude);
      this.$(".table-column.latitude").append(latitude.render().el);

      // Longitude
      var longitude = new cdb.forms.Combo({
        model:        this.model,
        property:     'longitude',
        width:        '220px',
        placeholder:  this._TEXTS.placeholder,
        extra:        this._getTableColumns()
      });

      this.addView(longitude);
      this.$(".table-column.longitude").append(longitude.render().el);

      // Error tab
      this.pane_info = new cdb.admin.ImportInfo({
        el:    this.$('div.infobox'),
        model: this.model
      });
      this.addView(this.pane_info);

      // Check if LONGITUDE and/or LATITUDE columns are present
      this._checkSelectedColumns()
    },

    // Check if table has longitude or latitude column
    // because select2 auto select those columns if they
    // are present
    _checkSelectedColumns: function() {
      this.model.set({
        longitude: this.$(".table-column.longitude select").val(),
        latitude: this.$(".table-column.latitude select").val()
      })
    },

    _onValidChange: function() {
      this.$('a.ok')[ this.model.get('valid') ? 'removeClass' : 'addClass' ]('disabled');
    },

    _onModelChange: function() {
      var isValid = this.model.get('latitude') && this.model.get('longitude') ? true : false;
      this.model.set('valid', isValid);
      
      if (isValid) {
        this.pane_info.hideTab();
      }
    },

    // Set value and trigger any action if needed
    setValue: function(d) {
      this.model && this.model.set(d);
      this.render();
    },

    _onOkClick: function(e) {
      if (e) this.killEvent(e);

      if (this.model.get('valid')) {
        this.trigger('geocodingChosen', this.model.attributes, this);
        this.pane_info.hideTab();
      } else {
        this.pane_info.activeTab('error', this._TEXTS.error );
      }
    }

  });