
  /**
   *  Default pane for any geocoding option,
   *  like LatLng, City, Postal, etc...
   *
   */

  cdb.admin.GeocodingDialog.Pane = cdb.core.View.extend({

    _NON_VALID_COLUMS: ['cartodb_id', 'the_geom', 'updated_at', 'created_at', 'cartodb_georef_status'],

    events: {
      'click a.ok': '_onOkClick'
    },

    initialize: function() {
      this.model = new cdb.admin.GeocodingDialog.Pane.Model()
      this.template = cdb.templates.getTemplate(this.options.template || 'table/views/geocoding_dialog/geocoding_dialog_pane');
      this._initBinds();
    },

    render: function() {
      // Clean and empty
      this.clearSubViews();
      this.$el.empty();

      // Render template
      this.$el.append(this.template( this.model.attributes ));

      // Init views
      this._initViews();

      return this;
    },

    _initBinds: function() {
      _.bindAll(this, '_onOkClick');
    },

    _initViews: function() {},

    // Get value from the model
    getValue: function() {
      return this.model.toJSON();
    },

    // Signal from parent to know this
    // pane has been activated
    setActive: function() {},

    // Set value and trigger any action if needed
    setValue: function(d) {
      this.model && this.model.set(d);
    },

    // Get available table columns
    _getTableColumns: function() {
      var self = this;

      return _.compact(
        _.map(this.table.get('schema'), function(arr) {
          if (!_.contains(self._NON_VALID_COLUMS, arr[0])) {
            return arr[0]
          }
          return null
        })
      );
    },

    _onOkClick: function(e) {
      if (e) this.killEvent(e);
    }

  })