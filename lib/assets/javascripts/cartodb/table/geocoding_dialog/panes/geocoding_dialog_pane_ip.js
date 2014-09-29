
  /**
   *  Pane to choose administrative region in the geocoding dialog
   *
   *  - It needs a table model, if not it won't be able
   *    to know table columns.
   *
   */
  

  cdb.admin.GeocodingDialog.Pane.IP = cdb.admin.GeocodingDialog.Pane.extend({

    className: 'geocoding-pane-default geocoding-pane-ip',

    _TEXTS: {
      placeholder:  _t('Select the column(s)'),
      error:        _t('You have to select a column')
    },

    initialize: function() {
      this.table = this.options.table;
      this.model = new cdb.admin.GeocodingDialog.Pane.Model({
        valid:          false,
        column_name:    '',
        kind:           'ipaddress',
        geometry_type:  'point'
      });
      this.template = cdb.templates.getTemplate(this.options.template || 'table/views/geocoding_dialog/geocoding_dialog_pane_ip');
      this._initBinds();
    },

    _initBinds: function() {
      _.bindAll(this, '_onOkClick');
      this.model.bind('change:column_name', this._onModelChange, this);
      this.model.bind('change:valid',       this._onValidChange, this);
    },

    _initViews: function() {
      // Column name
      var column = new cdb.forms.Combo({
        model:        this.model,
        property:     'column_name',
        width:        '172px',
        placeholder:  this._TEXTS.placeholder,
        extra:        this._getTableColumns()
      });

      this.addView(column);
      this.$(".geocoding-pane-select.ip").append(column.render().el);

      // Error tab
      this.pane_info = new cdb.admin.ImportInfo({
        el:    this.$('div.infobox'),
        model: this.model
      });
      this.addView(this.pane_info);
    },

    _onValidChange: function() {
      this.$('a.ok')[ this.model.get('valid') ? 'removeClass' : 'addClass' ]('disabled');
    },

    _onModelChange: function() {
      var isValid = this.model.get('column_name') ? true : false;
      this.model.set('valid', isValid);

      if (isValid) {
        this.pane_info.hideTab();
      }
    },

    _onOkClick: function(e) {
      if (e) this.killEvent(e);

      if (this.model.get('valid')) {
        this.trigger('geocodingChosen', this.model.attributes, this);
      } else {
        this.pane_info.activeTab('error', this._TEXTS.error );
      }
    }

  });