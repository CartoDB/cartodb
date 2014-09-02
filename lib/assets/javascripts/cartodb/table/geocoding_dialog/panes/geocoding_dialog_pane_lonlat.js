
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
      placeholder: _t('Select the column(s)')
    },

    initialize: function() {
      this.table = this.options.table;
      this.model = new cdb.admin.GeocodingDialog.Pane.Model({
        valid:      false,
        longitude:  '',
        latitude:   ''
      });
      this.template = cdb.templates.getTemplate(this.options.template || 'table/views/geocoding_dialog/geocoding_dialog_pane');
      this._initBinds();
    },

    _initBinds: function() {
      this.model.bind('change', this._onModelChange, this);
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
    },


    _onModelChange: function() {
      var isValid = this.model.get('latitude') && this.model.get('longitude') ? true : false;
      this.model.set('valid', isValid, { silent: false });
      this.trigger('valueChanged', this.model.attributes, this);
    }

  });