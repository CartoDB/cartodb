
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
        column:       _t('Select the column(s)'),
        column_text:  _t('Select column or type it')
      },
      error: _t('You must select at least one column.')
    },

    initialize: function() {
      this.table = this.options.table;

      this.available_geometries = new cdb.admin.GeocodingDialog.AvailableGeometries({
        kind: this.options.kind
      });

      this.model = new cdb.admin.GeocodingDialog.Pane.Model({
        valid:          false,
        column_name:    "",
        location:       "",
        geometry_type:  "",
        text:           false,
        kind:           this.options.kind || "anytype",
        step:           0
      });

      this.template = cdb.templates.getTemplate(this.options.template || 'table/views/geocoding_dialog/geocoding_dialog_pane_default_geocoder');
      this._initBinds();
    },

    _initBinds: function() {
      _.bindAll(this, '_onBackClick', '_onOkClick');

      this.model.bind('change',           this._onModelChange, this);
      this.model.bind('change',           this._checkOkButton, this);
      this.model.bind('change:step',      this._onChangeStep, this)

      this.model.bind('change:location',  this._getAvailableGeometries, this);

      this.available_geometries.bind('change:available_geometries', this._checkOkButton, this);
      this.add_related_model(this.available_geometries);
    },

    _initViews: function() {
      var self = this;

      // Columns
      var columns = new cdb.forms.Combo({
        model:        this.model,
        property:     'column_name',
        width:        '178px',
        placeholder:  this._TEXTS.placeholder.column,
        extra:        this._getTableColumns()
      });

      this.addView(columns);
      this.$(".geocoding-pane-select.kind").append(columns.render().el);

      // Location
      var location = new cdb.forms.CustomTextCombo({
        model:        this.model,
        property:     'location',
        text:         'text',
        width:        '178px',
        placeholder:  this._TEXTS.placeholder.column_text,
        extra:        this._getTableColumnsWithType()
      });

      this.addView(location);
      this.$(".geocoding-pane-select.location").append(location.render().el);

      // Error tab
      this.pane_info = new cdb.admin.ImportInfo({
        el:    this.$('div.infobox'),
        model: this.model
      });
      this.addView(this.pane_info);

      // Geocoder styles
      this.geocoder_styles = new cdb.admin.GeocodingDialog.Content.Styles({
        model:                this.model,
        available_geometries: this.available_geometries
      });

      this.addView(this.geocoder_styles);
      this.$(".geocoding-pane-step.second").append(this.geocoder_styles.render().el);
    },

    _onModelChange: function() {
      var isValid = this.model.get('column_name') && this.model.get('location') && this.model.get('geometry_type');
      this.model.set('valid', isValid ? true : false);
    },

    _getAvailableGeometries: function() {
      var isText = this.model.get('text');
      var location = this.model.get('location');
      var data = { kind: this.options.kind };

      // Location is empty? -> Let's search in the world!
      if (location === "") {
        data.free_text = 'World';
      } else {
        // If location is not empty...

        // ... and it's a free text
        if (isText) {
          data.free_text = location;
        } else {
          data = _.extend(
            data,
            {
              column_name:  location,
              table_name:   this.table.get('id')
            }
          );
        }
      }

      // Get available geometries!
      this.available_geometries.unset('available_geometries');
      this.available_geometries.fetch({ data: data });
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
      var enabled = this.model.get('column_name');

      if (this.model.get('step') === 0) {
        this.$('a.ok')[ enabled ? 'removeClass' : 'addClass' ]('disabled');
      } else {
        enabled = enabled && this.available_geometries.get('available_geometries') && this.available_geometries.get('available_geometries').length > 0;
        this.$('a.ok')[ enabled ? 'removeClass' : 'addClass' ]('disabled');
      }
    },

    _onBackClick: function(e) {
      if (e) this.killEvent(e);

      this.model.set({
        geometry_type:  '',
        step:           0
      })
    },

    _getTableColumnsWithType: function() {
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

    setActive: function() {
      this._changePaneHeight(0);
      // Check if avaiblable geometries attribute is empty
      var available_geometries = this.available_geometries.get('available_geometries');
      if ( !available_geometries || ( available_geometries && available_geometries.length === 0 )) {
        this._getAvailableGeometries();
      }
    },

    _onOkClick: function(e) {
      if (e) this.killEvent(e);

      if (this.model.get('column_name')) {
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