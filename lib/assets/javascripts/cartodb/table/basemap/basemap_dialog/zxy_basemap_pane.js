
  /**
   *  ZXY pane for basemap chooser
   */


  cdb.admin.ZXYBasemapChooserPane = cdb.admin.BasemapChooserPane.extend({
    className: "basemap-pane",

    events: {
      'focusin input[type="text"]' : "_focusIn",
      'focusout input[type="text"]': "_focusOut",
      'keyup input[type="text"]'   : "_onInputChange",
      'paste input[type="text"]'   : "_onInputPaste"
    },

    initialize: function() {
      _.bindAll(this, "_errorChooser", "_onInputChange");

      this.template = this.options.template || cdb.templates.getTemplate('table/views/basemap/basemap_chooser_pane');
      this.render();
    },

    render: function() {
      this.$el.html(this.template({
        placeholder: 'Insert your XYZ URL template',
        error: 'Your XYZ URL template is not valid.'
      }));
      return this;
    },

    // If url input change, hide uploader
    _onInputPaste: function(e) {
      // Hack necessary to get input value after a paste event
      // Paste event is fired before text is applied / added to the input
      setTimeout(this._onInputChange,100);
    },

    _onInputChange: function(e) {
      var $el = this.$("input[type='text']")
        , val = $el.val();

      // If form is submitted, go out!
      if (e && e.keyCode == 13) {
        return false;
      }

      if (val == "") {
        this._hideLoader();
        this._hideError();
        this.trigger('inputChange', '', this);
      } else {
        this.trigger('inputChange', val, this);
      }
    },

    /**
     * Hide loader
     */
    _hideLoader: function() {
      this.$el.find("div.loader").hide();
    },

    /**
     * Show loader
     */
    _showLoader: function() {
      this.$el.find("div.loader").show();
    },

    _hideError: function() {
      this.$el.find("input").removeClass("error");
      this.$("div.info").removeClass("error active")
    },

    _showError: function(error) {

      if (typeof error == "object" || !error) error = "This URL is not valid.";

      this.$(".info p").html(error);
      this.$el.find("input").addClass("error");
      this.$el.find("div.info").addClass("error active");

    },

    /**
     * return a https url if the current application is loaded from https
     */
    _fixHTTPS: function(url, loc) {
      loc = loc || location;

      // fix the url to https or http
      if (url.indexOf('https') !== 0 && loc.protocol === 'https:') {
        // search for mapping
        return url.replace(/http/, 'https');
      }
      return url;
    },

    /**
     * Style box when user focuses in/out over the input
     */

    _focusIn: function(ev) {
      $(ev.target)
        .closest('div.input')
        .addClass('active')
    },

    _focusOut: function(ev) {
      $(ev.target)
        .closest('div.input')
        .removeClass('active')
    },

    /**
     * this function checks that the url is correct and tries to get the tilejson
     */
    checkTileJson: function(val) {
      var self = this;

      var $input = this.$el.find('input'),
        url = this._lowerXYZ(val),
        self = this,
        type = 'json',
        subdomains = ['a', 'b', 'c'];

      // Remove error
      this._hideError();

      // Start loader
      this._showLoader();

      // Disable input
      $input.attr("disabled");

      // Detects the URL's tile (mapbox, xyz or json)
      if (url.indexOf("{x}") != -1) {
        type = 'xyz';

        url = url.replace(/\{s\}/g, function() {
            return subdomains[Math.floor(Math.random() * 3)]
        })
        .replace(/\{x\}/g, "0")
        .replace(/\{y\}/g, "0")
        .replace(/\{z\}/g, "0");
      } else { // If not, check https
        url = this._fixHTTPS(url);
      }

      if (type == "xyz") {
        var image = new Image();

        image.onload = function(e) {
          self._successChooser({ tiles: [self._lowerXYZ(val)] });
        }

        image.onerror = this._errorChooser;
        image.src = url;

      } else {
        self._errorChooser();
      }
    },

    _successChooser: function(data) {
      // Check if the respond is an array
      // In that case, get only the first
      if (_.isArray(data) && _.size(data) > 0) {
        data = _.first(data);
      }

      var layer = new cdb.admin.TileLayer({
        urlTemplate: data.tiles[0],
        attribution: data.attribution || null,
        maxZoom: data.maxzoom || 21,
        minZoom: data.minzoom || 0,
        name: data.name || ''
      });

      var name = layer._generateClassName(data.tiles[0]);

      if (_.include(this.options.layer_ids, name)) {
        this._errorChooser("This basemap is already added.");
        return;
      }

      this.trigger('successChooser', layer, data.tiles[0]);

    },

    _lowerXYZ: function(url) {
      return url.replace(/\{S\}/g, "{s}")
        .replace(/\{X\}/g, "{x}")
        .replace(/\{Y\}/g, "{y}")
        .replace(/\{Z\}/g, "{z}");
    },

    /**
     * If the url is not valid
     */
    _errorChooser: function(message) {
      var $input = this.$el.find("input");

      // End loader
      this._hideLoader();

      // Show error
      this._showError(message);

      // Enable input
      $input.attr("disabled");

      // Enable dialog? nop!
      this.trigger('errorChooser');
    }
  });
