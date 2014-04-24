
  /**
   *  NASA pane for basemap chooser
   */

  cdb.admin.NASABasemapChooserPane = cdb.admin.BasemapChooserPane.extend({
    
    className: "basemap-pane nasa-pane",

    _NASA: {

      day: {
        url:          'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/MODIS_Terra_CorrectedReflectance_TrueColor/default/<%= date %>/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpeg',
        limit:        '2012-5-1',
        attribution:  '<a href="http://earthdata.nasa.gov/labs/worldview/" target="_blank">NASA Worldview</a>',
        name:         'NASA day',
        maxZoom:      9,
        minZoom:      1
      },

      night: {
        url:          'http://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/<%= date %>/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpeg',
        limit:        '2012-5-1',
        attribution:  '<a href="http://earthdata.nasa.gov/labs/worldview/" target="_blank">NASA Worldview</a>',
        name:         'NASA night',
        maxZoom:      8,
        minZoom:      1
      }
    },

    _TEXTS: {
      disclaimer: _t('NASA text'),
      errors: {
        added:    _t('This basemap is already added'),
        limit:    _t('The date has to be before <%= date %> until today')
      }
    },

    events: {},

    initialize: function() {
      this.model = new cdb.core.Model({ value: '', type: 'day' });
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
      var date = new cdb.admin.DateField({ model: this.model });
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

    _isValidDate: function(str) {
      var type = this.model.get('type');
      var date = new Date(str.split('T')[0]);
      var today = new Date();
      var limit = new Date(this._NASA[type].limit);
      return date <= today && date >= limit
    },

    _setURL: function(str, type) {
      var date = new Date(str.split('T')[0]);
      date.setDate(date.getDate() + 20);

      var str = date.getFullYear()  + '-'
             + ('0' + (date.getMonth()+1)).slice(-2) + '-'
             + ('0' + date.getDate()).slice(-2);
      
      return _.template(this._NASA[type].url)({ date: str });
    },

    _setValue: function(mdl, date) {
      var date = this.model.get('value');
      var type = this.model.get('type');

      if (this._isValidDate(date)) {
        // Hide error
        this._hideError();
        // Set value into input
        this.$('input.url').val(this._setURL(date, type));
        // Trigger input change
        this.trigger('inputChange', date, this);
      } else {
        // Show error
        this._showError();
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
      this.$("div.info").removeClass("error active")
    },

    _showError: function(error) {
      if (error) this.$(".info p").html(error);
      this.$("div.info").addClass("error active");
    },

    checkTileJson: function(val) {
      this._successChooser({ tiles: [this._lowerXYZ(val)] });
    },

    _successChooser: function(data) {
      var type = this.model.get('type');

      // Check if the respond is an array
      // In that case, get only the first
      if (_.isArray(data) && _.size(data) > 0) {
        data = _.first(data);
      }

      var layer = new cdb.admin.TileLayer({
        urlTemplate:  data.tiles[0],
        attribution:  this._NASA[type].attribution,
        maxZoom:      this._NASA[type].maxZoom,
        minZoom:      this._NASA[type].minZoom,
        name:         this._NASA[type].name
      });

      var name = layer._generateClassName(data.tiles[0]);

      if (_.include(this.options.layer_ids, name)) {
        // Set empty value into input
        this.$('input.url').val('');
        // Trigger input change
        this.trigger('inputChange', '', this);
        // Show error
        this._showError(this._TEXTS.errors.added);

        return;
      }

      this.trigger('successChooser', layer, data.tiles[0]);
    }

  });
