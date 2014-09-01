
  /**
   *  Default pane for any geocoding option,
   *  like LatLng, City, Postal, etc...
   *
   */

  cdb.admin.GeocodingDialog.Pane = cdb.core.View.extend({

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

    _initBinds: function() {},

    _initViews: function() {},

    // Get value from the model
    getValue: function() {
      return this.model.toJSON();
    },

    // Set value and trigger any action if needed
    setValue: function(d) {
      this.model && this.model.set(d);
    },

  })