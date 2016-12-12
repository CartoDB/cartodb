
  /**
   *  Geometry field -> Place to choose and edit geometry field
   *  - It accepts a model with {attribute: 'the_geom', value: '{{ "type": "Point", "coordinates": [100.0, 0.0] }}'}
   *  var geometry = new cdb.admin.GeometryField({ model: model, row: row, rowNumber: rowNumber })
   */

  cdb.admin.GeometryField = cdb.admin.StringField.extend({

    className: 'field geometry',

    default_options: {
      template_name: 'old_common/views/forms/geometry_field',
      label:          false,
      readOnly:       false
    },

    events: {
      'click .switch':    '_chooseEditor',
      'keyup input':      '_onKeyInputUp',
      'keydown textarea': '_onKeyTextareaDown',
      'change textarea':  '_onChange'
    },

    initialize: function() {
      _.defaults(this.options, this.default_options);

      _.bindAll(this, '_chooseEditor', '_onKeyInputUp', '_onKeyTextareaDown');

      this.template_base = this.options.template_base ? _.template(this.options.template_base) : cdb.templates.getTemplate(this.options.template_name);

      // Set important variables
      this.valid = true;
      this.row = this.options.row;

      // Get OS variable
      this._setOS();
    },

    render: function() {
      this.$el.html(this.template_base(_.extend(this.model.toJSON(), this.options)));

      // Apply views
      this._initViews();

      // Check readOnly and unbind all events
      if (this.options.readOnly) {
        this.undelegateEvents();
      }

      return this;
    },

    _initViews: function() {
      var geojson = this.model.get('value');

      if (!this.row.isGeomLoaded()) {
        // the_geom contents still haven't been loaded
        this._loadGeom();
      } else {
        this._chooseGeom();
      }
    },

    /**
     *  Load geom if it is not loaded
     */
    _loadGeom: function() {
      var self = this;
      this.row.bind('change', function() {
        self.model.set('value', self.row.get("the_geom"));
        self._chooseGeom();
      }, this);
      this.row.fetch({
        rowNumber: this.options.rowNumber
      });
    },


    /**
     *  Choose scenario for the editor
     */
    _chooseGeom: function() {
      var geom = null;

      try {
        geom = JSON.parse(this.model.get('value'));
      } catch(err) {
        // if the geom is not a valid json value
      }

      if (!this.options.readOnly) {
        if (!geom || geom.type.toLowerCase() == "point") {
          // Set status to point
          this.status = "point";
          // Remove loader
          this.$(".loader").remove();
          // Fill inputs
          this.$(".point").show();
          this.$(".selector").show();

          if (geom) {
            this.$("input.longitude").val(geom.coordinates[0]);
            this.$("input.latitude").val(geom.coordinates[1]);
            this.$("textarea").val(JSON.stringify(geom));
          }
        } else {
          // Set status to rest
          this.status = "rest";
          // Remove loader
          this.$(".loader").remove();
          // Fill textarea
          this.$(".rest").show();
          this.$("textarea").val(this.model.get('value'));
        }
      } else {
        this.$(".loader").remove();
        this.$(".selector").show();
        this.$("textarea").val(this.model.get('value'));
      }
    },

    _chooseEditor: function(ev) {
      this.killEvent(ev);

      var $el = $(ev.target).closest("a");

      // Change status value
      this.status = (this.status == "point") ? "rest" : "point";

      // Change switch
      $el
        .removeClass(this.status == "rest" ? "disabled" : "enabled")
        .addClass(this.status == "rest" ? "enabled" : "disabled");

      this.updateInputs();

      // Change between point to geom editor
      if (this.status == "rest") {
        this.$('.point').hide();
        this.$('.rest').show();
        this.valid = true;
      } else {
        this.$('.point').show();
        this.$('.rest').hide();
        this.valid = this._checkInputs();
      }
    },

    updateInputs: function() {
      if(this.model.get('value')) {
        try {
          var geom = JSON.parse(this.model.get('value'));
          this.$("input.longitude").val(geom.coordinates[0]);
          this.$("input.latitude").val(geom.coordinates[1]);
          this.$("textarea").val(JSON.stringify(geom));
        } catch(error) {
          return false;
        }
      }
    },

    /**
     *  Check if the number is well formed or not
     */
    _checkNumber: function(number, type) {
      var pattern = /^-?(?:[0-9]+|[0-9]*\.[0-9]+)$/;
      if (pattern.test(number)) {

        if (type === "lat") {
          if ( number >= -90 && number <= 90 ) {
            return true
          } else {
            return false
          }
        }

        if (type === "lon") {
          if ( number >= -180 && number <= 180 ) {
            return true
          } else {
            return false
          }
        }

        return true
      } else {
        return false
      }
    },


    /**
     *  Check latitude and longitude inputs
     */
    _checkInputs: function() {
      var enable = true
        , $lat = this.$("input.latitude")
        , $lon = this.$("input.longitude");

      if (this._checkNumber($lat.val(), 'lat')) {
        $lat.removeClass("error");
      } else {
        $lat.addClass("error");
        enable = false;
      }

      if (this._checkNumber($lon.val(), 'lon')) {
        $lon.removeClass("error");
      } else {
        $lon.addClass("error");
        enable = false;
      }

      return enable;
    },

    /**
     *  When user type any number we check it if it is correct
     */
    _onKeyInputUp: function(e) {

      if (this._checkInputs()) {

        if (e.keyCode === 13) {
          e.preventDefault();
          this._triggerEvent('ENTER');
          return false;
        }

        this.valid = true;

        // Save model
        var lat = parseFloat(this.$("input.latitude").val())
          , lon = parseFloat(this.$("input.longitude").val());

        this.model.set('value', JSON.stringify({"type": "Point", "coordinates": [lon,lat]}));

      } else {
        this.valid = false;
      }
    },

    /**
     *  Key press binding for textarea
     */
    _onKeyTextareaDown: function(e) {
      if (((this.so=="mac" && e.metaKey) || (this.so=="rest" && e.ctrlKey)) && e.keyCode == 13 ) {
        e.preventDefault();
        this._triggerEvent('ENTER');
        return false;
      }

      var value = $(e.target).val();

      this.model.set('value', value);
    },
  })
