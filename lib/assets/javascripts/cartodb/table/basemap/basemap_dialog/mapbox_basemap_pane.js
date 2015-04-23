
  /**
   *  Mapbox pane for basemap chooser
   */

  cdb.admin.MapboxBasemapChooserPane = cdb.admin.BasemapChooserPane.extend({
    className: "basemap-pane",

    _MAPBOX: {
      version: 4,
      https: 'https://dnv9my2eseobd.cloudfront.net',
      base: 'https://a.tiles.mapbox.com/'
    },

    events: {
      'focusin input[type="text"]' : "_focusIn",
      'focusout input[type="text"]': "_focusOut",
      'keyup input[type="text"]'   : "_onInputChange",
      'paste input[type="text"]'   : "_onInputPaste"
    },

    initialize: function() {
      _.bindAll(this, "_errorChooser", "_onInputChange");

      this.template = this.options.template || cdb.templates.getTemplate('table/views/basemap/basemap_chooser_mapbox_pane');
      this.render();
    },

    render: function() {
      this.$el.html(this.template({
        placeholder: 'Insert your Mapbox map URL or map id',
        placeholder_access_token: 'Insert your Mapbox access token',
        error: 'Your Mapbox map URL or your Mapbox map id is not valid.'
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

      if (typeof error == "object" || !error) {
        if (error && error.status &&  error.status === 401) {
          error = "Error retrieving your basemap. Please, check your access token.";
        } else {
          error = "This URL is not valid.";
        }
      }

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
        var i = url.indexOf('mapbox.com');
        if (i != -1) {
            return this._MAPBOX.https + url.substr(i + 'mapbox.com'.length);
        }
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
    checkTileJson: function(val, access_token) {
      var self = this;

      if (!access_token) {
        this._errorChooser({ status: 401 });
        return;
      }

      var $input = this.$el.find('input');
      var url = this._lowerXYZ(val);
      var type = 'json';
      var subdomains = ['a', 'b', 'c'];

      // Remove error
      this._hideError();

      // Start loader
      this._showLoader();

      // Disable input
      $input.attr("disabled");

      var mapbox_id;

      // Detects the URL's type
      if (url.indexOf('{x}') < 0 && url.indexOf('tiles.mapbox.com') != -1) {

        mapbox_id = this._getMapBoxMapID(url);

        if (mapbox_id) {
          type = "mapbox_id";
          url  = mapbox_id;
        }

      } else if (url.indexOf("{x}") != -1) {

        type = 'xyz';

        url = url.replace(/\{s\}/g, function() {
            return subdomains[Math.floor(Math.random() * 3)]
        })
        .replace(/\{x\}/g, "0")
        .replace(/\{y\}/g, "0")
        .replace(/\{z\}/g, "0");

      } else if (url && url.indexOf('http') < 0 && url.match(/(.*?)\.(.*)/) != null && url.match(/(.*?)\.(.*)/).length == 3) {
        type = 'mapbox_id';
        mapbox_id = val;
      } else { // If not, check https
        url = this._fixHTTPS(url);
      }


      if (type == 'mapbox') {
        this._successChooser({ tiles: [url] });
      } else if (type == "xyz") {

        var image = new Image();

        image.onload = function(e) {
          self._successChooser({ tiles: [self._lowerXYZ(val)] });
        }

        image.onerror = this._errorChooser;
        image.src = url;

      } else if (type == "mapbox_id") {

        var image = new Image();

        var params = "?access_token=" + access_token;
        var base_url = self._MAPBOX.base + "v" + self._MAPBOX.version + "/" + mapbox_id;
        var tile_url = base_url + "/{z}/{x}/{y}.png" + params;
        var json_url = base_url + ".json" + params;

        // JQuery has a faulty implementation of the getJSON method and doesn't return
        // a 404, so we use a timeout. TODO: replace with CORS
        var errorTimeout = setTimeout(function() {
          self._errorChooser();
        }, 5000);

        $.ajax({
          url: json_url,
          success: function(data) {
            clearTimeout(errorTimeout);
            self._successChooser({ tiles: [tile_url], attribution: data.attribution, minzoom: data.minzoom, maxzoom: data.maxzoom });
          },
          error: this._errorChooser
        })


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

    // Extracts the Mapbox MapId from a Mapbox URL
    _getMapBoxMapID: function(url) {
      // http://d.tiles.mapbox.com/v3/{user}.{map}/3/4/3.png
      // http://a.tiles.mapbox.com/v3/{user}.{map}/page.html
      // http://a.tiles.mapbox.com/v4/{user}.{map}.*
      var reg1 = /https?:\/\/[a-z]?\.?tiles\.mapbox.com\/v(\d)\/([^\/.]*)\.([^\/.]*)/;

      // https://tiles.mapbox.com/{user}/edit/{map}?newmap&preset=Streets#3/0.00/-0.09
      var reg2 = /https?:\/\/tiles\.mapbox\.com\/(.*?)\/edit\/(.*?)(\?|#)/;

      var match = '';

      // Check first expresion
      match = url.match(reg1);

      if (match && match[1] && match[2]) {
        return match[2] + "." + match[3];
      }

      // Check second expresion
      match = url.match(reg2);

      if (match && match[1] && match[2]) {
        return match[1] + "." + match[2];
      }

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
      this.trigger('errorChooser', '', this);
    }
  });
