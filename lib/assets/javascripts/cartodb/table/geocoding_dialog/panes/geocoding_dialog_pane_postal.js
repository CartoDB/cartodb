
  /**
   *  Pane to choose postal codes in the geocoding dialog
   *
   *  - It needs a table model, if not it won't be able
   *    to know table columns.
   *
   */
  

  cdb.admin.GeocodingDialog.Pane.Postal = cdb.admin.GeocodingDialog.Pane.extend({

    className: 'geocoding-pane-default geocoding-pane-postal',

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

    _initViews: function() {},


    _onModelChange: function() {},

    

  });