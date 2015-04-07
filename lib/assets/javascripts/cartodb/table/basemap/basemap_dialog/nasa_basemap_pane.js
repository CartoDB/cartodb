
  /**
   *  NASA pane for basemap chooser
   */

  cdb.admin.NASABasemapChooserPane = cdb.admin.BasemapChooserPane.extend({
    
    className: "basemap-pane nasa-pane",

    _NASA: {

      day: {
        url:          'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/<%- date %>/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg',
        limit:        '2012-05-01',
        default:      '2012-05-01',
        attribution:  '<a href="http://earthdata.nasa.gov/gibs" target="_blank">NASA EOSDIS GIBS</a>',
        name:         'NASA Terra',
        maxZoom:      9,
        minZoom:      1
      },

      night: {
        url:          'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/<%- date %>/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
        limit:        '2012-05-01',
        default:      '2012-05-02',
        attribution:  '<a href="http://earthdata.nasa.gov/gibs" target="_blank">NASA EOSDIS GIBS</a>',
        name:         'NASA Earth at night',
        maxZoom:      8,
        minZoom:      1
      }
    },

    _TEXTS: {
      disclaimer: _t('NASA text'),
      errors: {
        added:    _t('This basemap is already added'),
        future:   _t('Sorry, NASA does not provide images of the future (yet)'),
        limit:    _t('These images aren\'t available because NASA was busy doing other things prior to this date ;)')
      }
    },

    events: {},

    initialize: function() {
      this.model = new cdb.core.Model({ value: this._getYesterdayDate(), type: 'day' });
      this.template = cdb.templates.getTemplate('table/views/basemap/basemap_chooser_nasa_pane');
      this._initBinds();
      this.render();
    },

    render: function() {
      this.clearSubViews();
      
      // Render template
      this.$el.html(this.template({
        disclaimer: this._TEXTS.disclaimer,
        error:      ''
      }));
      
      // Create date view
      var date = this.date = new cdb.admin.DateField({ model: this.model });
      this.$('div.date').append(date.render().el);
      this.addView(date);

      // Create combo view
      var type = new cdb.forms.Combo({
        model:    this.model,
        property: 'type',
        width:    '80px',
        extra:    ['day', 'night']
      });
      this.$('div.type').append(type.render().el);
      this.addView(type);

      return this;
    },

    _initBinds: function() {
      this.model.bind('change', this._setValue, this);
    },

    _getYesterdayDate: function() {
      var date = new Date();
      date.setDate(date.getDate() - 1);
      return date.getFullYear() + '-' +
            ('0' + (date.getMonth() + 1)).slice(-2) + '-' +
            ('0' + date.getDate()).slice(-2) + 'T00:00:00'
    },

    _isValidDate: function(str) {
      var type = this.model.get('type');
      var date = new Date(str.replace(/-/g,'/').split('T')[0]);
      var today = new Date();
      var limit = new Date(this._NASA[type].limit);

      var error = '';
      var valid = true; 

      if (date > today) {
        error = this._TEXTS.errors.future;
        valid = false;
      }

      if (date < limit) {
        error = this._TEXTS.errors.limit;
        valid = false;
      }

      return {
        valid: valid,
        error: error
      }
    },

    _setURL: function(str, type) {
      var date = new Date(str.replace(/-/g,'/').split('T')[0]);

      var str = date.getFullYear()  + '-'
             + ('0' + (date.getMonth() + 1)).slice(-2) + '-'
             + ('0' + date.getDate()).slice(-2);

      return _.template(this._NASA[type].url)({ date: str });
    },

    _setValue: function(mdl, date) {
      var date = this.model.get('value');
      var type = this.model.get('type');

      // Show date view or not
      if (this.date) {
        if (mdl.changed && mdl.changed.type && mdl.changed.type === "night") {
          // If it is night, no matter the date, so we set the default one
          this.date.hide();
          date = this._NASA[type].default;
        } else {
          this.date.show();
        }
      }

      var date_checker = this._isValidDate(date);

      if (date_checker.valid) {
        // Hide error
        this._hideError();
        // Set value into input
        this.$('input.url').val(this._setURL(date, type));
        // Trigger input change
        this.trigger('inputChange', date, this);
      } else {
        // Show error
        this._showError(date_checker.error);
        // Set empty value into input
        this.$('input.url').val('');
        // Trigger input change
        this.trigger('inputChange', '', this);
      }
    },

    _lowerXYZ: function(url) {
      return url.replace(/\{S\}/g, "{s}")
        .replace(/\{X\}/g, "{x}")
        .replace(/\{Y\}/g, "{y}")
        .replace(/\{Z\}/g, "{z}");
    },

    _hideLoader: function() {},
    
    _hideError: function() {
      var self = this;
      this.$("div.info").removeClass("active");
      // Remove error text avoiding weird spaces
      setTimeout(function() {
        self.$('div.info p').html('');
      },100);
    },

    _showError: function(error) {
      if (error) this.$(".info p").html(error);
      this.$("div.info").addClass("active");
    },

    checkTileJson: function(val) {
      this._successChooser({ tiles: [this._lowerXYZ(val)] });
    },

    _successChooser: function(data) {
      var type = this.model.get('type');
      var date = this.model.get('value');

      var date_checker = this._isValidDate(date);

      if (!date_checker.valid) {
        this.trigger('errorChooser');
        return;
      }

      // Check if the respond is an array
      // In that case, get only the first
      if (_.isArray(data) && _.size(data) > 0) {
        data = _.first(data);
      }

      var name = this._NASA[type].name;
      if (type === "day" && this.model.get('value')) {
        var date = new Date(this.model.get('value').replace(/-/g,'/').split('T')[0]);
        name = name + ' ' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
      }

      var layer = new cdb.admin.TileLayer({
        urlTemplate:  data.tiles[0],
        attribution:  this._NASA[type].attribution,
        maxZoom:      this._NASA[type].maxZoom,
        minZoom:      this._NASA[type].minZoom,
        name:         name
      });

      var name = layer._generateClassName(data.tiles[0]);

      if (_.include(this.options.layer_ids, name)) {
        // Show error
        this._showError(this._TEXTS.errors.added);
        // Trigger error
        this.trigger('errorChooser');

        return false;
      }

      this.trigger('successChooser', layer, data.tiles[0]);
    }

  });
