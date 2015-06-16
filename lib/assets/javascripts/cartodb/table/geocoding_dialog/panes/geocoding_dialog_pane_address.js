
  
  /**
   *  Pane to geocode an address in the World.
   *
   *  - It needs a table and a user models.
   *
   */
  

  cdb.admin.GeocodingDialog.Pane.Address = cdb.admin.GeocodingDialog.Pane.extend({

    className: 'geocoding-pane-default geocoding-pane-address',

    // TODO: Get this value from user geocoding parameters
    _GEOCODING_BLOCK_SIZE: 1000,

    _TEXTS: {
      placeholder:  _t('Select column or type it'),
      error: {
        valid:      _t('You need to specify, at least, the column where your addresses are'),
        agreement:  _t('It is necessary to accept the cost of this geocoding task')
      }
    },

    events: {
      'click .geocoding-pane-terms label':  '_onLabelClick',
      'click #geocoding-address-terms':     '_onTermsClick',
      'click a.ok':                         '_onOkClick'
    },

    initialize: function() {
      this.user = this.options.user;
      this.table = this.options.table;

      this.model = new cdb.admin.GeocodingDialog.Pane.Model({
        valid:      false,
        formatter:  "",
        kind:       "high-resolution"
      });

      // Create custom models
      this._createCustomModels();

      this.template = cdb.templates.getTemplate('table/views/geocoding_dialog/geocoding_dialog_pane_address');

      this._initBinds();

      // Get estimation
      this.estimation.fetch();
    },

    render: function() {
      // Clean and empty
      this.clearSubViews();
      this.$el.empty();

      // Render template with user geocoding params
      this.$el.append(
        this.template(
          _.extend(
            {
              googleUser:       this.user.featureEnabled('google_maps'),
              agreement:        this.model.get('agreement'),
              estimation_cost:  this.estimation.get('estimation'),
              estimation_rows:  this.estimation.get('rows'),
              block_size:       this._GEOCODING_BLOCK_SIZE
            },
            this.user.get('geocoding')
          )
        )
      );

      // Init binds
      this._initBinds();

      // Init views
      this._initViews();

      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onOkClick', '_onTermsClick');

      this.model.bind('change:agreement', this._onTermsChange, this);

      this.model.bind('change:valid', this._onModelChange, this);

      this.country_model.bind('change', this._onCustomModelChange, this)
      this.add_related_model(this.country_model);

      this.state_model.bind('change', this._onCustomModelChange, this)
      this.add_related_model(this.state_model);

      this.address_model.bind('change', this._onCustomModelChange, this)
      this.add_related_model(this.address_model);

      this.additional_columns.bind('add remove change', this._onAdditionalColumnsChange, this);
      this.add_related_model(this.additional_columns);

      this.estimation.bind('change',  this._onEstimationChange, this);
      this.estimation.bind('error',   this._onEstimationError, this);
      this.add_related_model(this.estimation);
    },

    _initViews: function() {
      // Address custom-combo view
      var address = new cdb.forms.CustomTextCombo({
        model:        this.address_model,
        property:     'columnValue',
        text:         'columnText',
        width:        '176px',
        placeholder:  this._TEXTS.placeholder,
        extra:        this._getTableColumns()
      });

      this.$(".address").append(address.render().el);
      this.addView(address);

      // State/province custom-combo view
      var state = new cdb.forms.CustomTextCombo({
        model:        this.state_model,
        property:     'columnValue',
        text:         'columnText',
        width:        '176px',
        placeholder:  this._TEXTS.placeholder,
        extra:        this._getTableColumns()
      });

      this.$(".state").append(state.render().el);
      this.addView(state);

      // Country custom-combo view
      var country = new cdb.forms.CustomTextCombo({
        model:        this.country_model,
        property:     'columnValue',
        text:         'columnText',
        width:        '176px',
        placeholder:  this._TEXTS.placeholder,
        extra:        this._getTableColumns()
      });

      this.$(".country").append(country.render().el);
      this.addView(country);

      // Error tab
      this.pane_info = new cdb.admin.ImportInfo({
        el:    this.$('div.infobox'),
        model: this.model
      });
      this.addView(this.pane_info);

      // Additional columns view
      var additional = new cdb.admin.GeocodingDialog.Pane.Address.Additional({
        el:           this.$('.geocoding-additional-columns'),
        collection:   this.additional_columns,
        model:        this.address_model,
        columns_list: this._getTableColumns()
      });
      additional.render();
      this.addView(additional);

      // Help tooltip
      var help_tooltip = new cdb.common.TipsyTooltip({
        el: this.$('i.help')
      });
      this.addView(help_tooltip);
    },

    _createCustomModels: function() {
      // Estimation model
      this.estimation = new cdb.admin.GeocodingDialog.EstimationModel({ id: this.table.getUnquotedName() });
      
      // Country model
      this.country_model = new cdb.admin.GeocodingDialog.ColumnModel();
      
      // State model
      this.state_model = new cdb.admin.GeocodingDialog.ColumnModel();
      
      // Address model
      this.address_model = new cdb.admin.GeocodingDialog.ColumnModel();

      // Additional columns models
      this.additional_columns = new cdb.admin.GeocodingDialog.ColumnsCollection();
    },

    _onEstimationChange: function() {
      // Check if it is needed to accept the terms
      if (!this.user.get('geocoding').hard_limit && ( this.estimation.get('estimation') > 0 || ( this.estimation.get('estimation') === undefined && !this.user.get('geocoding').hard_limit ))) {
        this.model.set('agreement', false);
      } else if (this.user.get('geocoding').hard_limit) {
        this.model.unset('agreement');
      }

      this.render();
    },

    _onEstimationError: function() {
      // Check if it is needed to accept the terms
      if (!this.user.get('geocoding').hard_limit) {
        this.model.set('agreement', false);
      } else {
        this.model.unset('agreement');
      }

      // Change estimation attributes triggering a new render
      this.estimation.set({
        estimation: -1,
        rows: -1
      });
    },

    _onModelChange: function() {
      this.$('.ok')[ this.model.get('valid') ? 'removeClass' : 'addClass' ]('disabled');
    },

    _onAdditionalColumnsChange: function() {
      this.trigger('changeSize', this);
      this._onCustomModelChange();
    },

    _onCustomModelChange: function() {
      var formatter = '';

      // TODO: improve checking custom model changes,
      // so much repeated code

      // Address?
      var address = this.address_model.getValue();
      if (address) {
        var isText = this.address_model.getText();

        if (formatter !== "") { formatter += ', '}

        formatter += (isText ? address.trim() : '{' + address + '}');
      }

      // Additional address columns?
      if (this.additional_columns.size() > 0) {
        this.additional_columns.each(function(m) {
          var val = m.getValue();
          if (val) {
            var isText = m.getText();

            // Should we add a comma?
            if (formatter !== "") { formatter += ', '}

            formatter +=  (isText ? val.trim()  : '{' + val + '}');
          }
        });
      }

      // Province?
      var state = this.state_model.getValue();
      if (state) {
        var isText = this.state_model.getText();

        // Should we add a comma?
        if (formatter !== "") { formatter += ', '}

        formatter += (isText ? state.trim() : '{' + state + '}');
      }

      // Country?
      var country = this.country_model.getValue();
      if (country) {
        var isText = this.country_model.getText();

        // Should we add a comma?
        if (formatter !== "") { formatter += ', '}

        formatter += (isText ? country.trim() : '{' + country + '}');
      }

      this.model.set({
        formatter:  formatter,
        valid:      formatter ? true : false
      });

      this.pane_info.hideTab();
    },

    _onTermsClick: function(e) {
      if (e) this.killEvent(e);

      var selected = this.$("#geocoding-address-terms").hasClass('enabled');

      if (this.model.get('agreement') !== undefined) {
        this.model.set('agreement', !selected);
      }

      if (!selected) {
        this.pane_info.hideTab();
        this._setInputError(false);
      }
    },

    _onTermsChange: function() {
      this.$('#geocoding-address-terms')[ this.model.get('agreement') ? 'addClass' : 'removeClass' ]('enabled');
    },

    _onLabelClick: function(e) {
      var $a = $(e.target).closest('a');

      if ($a.length === 0) {
        if (e) this.killEvent(e);
        this._onTermsClick();  
      }
    },

    _getTableColumns: function() {
      var self = this;
      var schema = this.table.get("original_schema") || this.table.get("schema");
      var allowedTypes = ["string", "number", "boolean", "date"];

      return _.filter(schema, function(field) {

        var name = field[0];
        var fieldType = field[1];

        return _.contains(allowedTypes, fieldType) && !_.contains(self._NON_VALID_COLUMS, name);

      }).map(function(field) {

        var name = field[0];

        return [field[1], field[0]];
      });
    },

    // Set geocoding terms with error class or not
    _setInputError: function(bool) {
      this.$('.geocoding-pane-terms label')[ bool ? 'addClass' : 'removeClass' ]('error')
    },

    _onOkClick: function(e) {
      if (e) this.killEvent(e);

      // Check valid
      if (this.model.get('valid') === false) {
        this.pane_info.activeTab('error', this._TEXTS.error.valid );
        return false;
      }

      // Check agreement if it exists
      if (this.model.get('agreement') !== undefined && this.model.get('agreement') === false) {
        this.pane_info.activeTab('error', this._TEXTS.error.agreement );
        this._setInputError(true);
        return false;
      }

      // If everything ok, remove error and let's go!
      this.pane_info.hideTab();
      this.trigger('geocodingChosen', this.model.attributes, this);
    },

    clean: function() {
      this.additional_columns.reset();
      cdb.admin.GeocodingDialog.Pane.prototype.clean.call(this);
    }

  });
