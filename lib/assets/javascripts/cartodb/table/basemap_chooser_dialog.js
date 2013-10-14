
  /**
   * Shows a dialog to choose another base map
   *
   * new BaseMapChooser()
   *
   */

  cdb.admin.BaseMapAdder = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title:  _t("Add your basemap"),
      ok:     _t("Add basemap")
    },

    _MAPBOX: {
      version: 3,
      https: 'https://dnv9my2eseobd.cloudfront.net',
      base: 'http://a.tiles.mapbox.com/'
    },

    _WAITING_INPUT_TIME: 1000,

    events: {
      "keydown input": "_checkEnter",
      "focusin input": "_focusIn",
      "focusout input": "_focusOut",
      "click .ok.button": "ok",
      "click .cancel": "_cancel",
      "click .close": "_cancel"
    },

    initialize: function() {
      _.bindAll(this, "_checkTileJson", "_successChooser", "_errorChooser", "_showLoader", "_hideLoader");

      _.extend(this.options, {
        title: this._TEXTS.title,
        description: '',
        clean_on_hide: true,
        cancel_button_classes: "margin15",
        ok_button_classes: "button grey",
        ok_title: this._TEXTS.ok,
        modal_type: "compressed",
        width: 512,
        modal_class: 'basemap_chooser_dialog'
      });

      this.constructor.__super__.initialize.apply(this);

      this.model = new cdb.core.Model({ enabled: true, url:'' });
    },

    render_content: function() {
      return this.getTemplate('table/views/basemap_chooser_dialog')();
    },

    /**
     * Check enter keydown
     */
    _checkEnter: function(ev) {
      // If it is a enter... nothing
      var code = (ev.keyCode ? ev.keyCode : ev.which);
      if (code == 13) {
        this.killEvent(ev);
        this.ok();
      }
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
     * If the url is not valid
     */
    _errorChooser: function(error) {
      var $input = this.$el.find("input");

      // End loader
      this._hideLoader();

      if (!error) error = "This tileJSON, XYZ or MapBox url is not valid.";
      this.$(".info.error p").html(error);

      // Show error
      $input.addClass("error");
      this.$("div.error").addClass("active");

      // Enable input
      $input.attr("disabled");

      // Enable dialog? nop!
      this.$("a.button.ok").removeClass("disabled");
      this.model.set("enabled", true);
    },


    /**
     * If the url is valid
     */
    _successChooser: function(data) {
      // End loader
      this._hideLoader();

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

      // Set the className from the urlTemplate of the basemap
      var name = layer._generateClassName(data.tiles[0]);
      layer.set("className", name);

      if (_.include(this.options.layer_ids, name)) {
        this._errorChooser("This basemap is already added.");
        return;
      }

      // do not save before add because the layer collection
      // has the correct url
      this.options.baseLayers.add(layer);
      layer.save();

      // Remove error
      this.$el.find("input").removeClass("error");
      this.$el.find(".error").removeClass("active");

      this.hide();
      this.options.ok && this.options.ok(layer);
    },


    /**
     * Show loader
     */
    _showLoader: function() {
      this.$el.find("div.loader").show();
    },


    /**
     * Hide loader
     */
    _hideLoader: function() {
      this.$el.find("div.loader").hide();
    },

    /**
     * return a https url if the current application is loaded form https
     */
    _fixHTTPS: function(url, loc) {
      loc = loc || location;

      // fix the url to https or http
      if (url.indexOf('https') !== 0 && loc.protocol === 'https:') {
        // search for mapping
        var i = url.indexOf('mapbox.com');
        if (i != -1) {
            return this._MAPBOX_HTTPS + url.substr(i + 'mapbox.com'.length);
        }
        return url.replace(/http/, 'https');
      }
      return url;
    },


    transformMapboxUrl: function(url) {
      // http://d.tiles.mapbox.com/v3/{user}.{map}/3/4/3.png
      // http://a.tiles.mapbox.com/v3/{user}.{map}/page.html
      var reg1 = /http:\/\/[a-z]?\.?tiles\.mapbox.com\/v(\d)\/(.*?)\//;

      // https://tiles.mapbox.com/{user}/edit/{map}?newmap&preset=Streets#3/0.00/-0.09
      var reg2 = /https?:\/\/tiles\.mapbox\.com\/(.*?)\/edit\/(.*?)(\?|#)/;


      var match = '';

        // Check first expresion
      match = url.match(reg1);
      if (match && match[1] && match[2]) {
        return this._MAPBOX.base + "v" + match[1] + "/" + match[2] + "/{z}/{x}/{y}.png";
      }

      // Check second expresion
      match = url.match(reg2);
      if (match && match[1] && match[2]) {
        return this._MAPBOX.base + "v" + this._MAPBOX.version + "/" + match[1] + "." + match[2] + "/{z}/{x}/{y}.png";
      }

      return url;
    },

    /**
     * this function checks that the url is correct and tries to get the tilejson
     */
    _checkTileJson: function(ev) {

      var $input = this.$el.find('input'),
        url = this._lowerXYZ($input.val()),
        self = this,
        type = 'json',
        subdomains = ['a', 'b', 'c'];

      // Remove error
      $input.removeClass("error");
      this.$el.find(".error").removeClass("active");

      // Start loader
      this._showLoader();

      // Disable input
      $input.attr("disabled");

      // Detects the URL's type (mapbox, xyz or json)
      if (url.indexOf('{x}') < 0 && url.indexOf('tiles.mapbox.com') != -1) {

        type = "mapbox";
        url = this.transformMapboxUrl(url);

      } else if (url.indexOf("{x}") != -1) {

        type = 'xyz';

        url = url.replace(/\{s\}/g, function() {
            return subdomains[Math.floor(Math.random() * 3)]
        })
        .replace(/\{x\}/g, "0")
        .replace(/\{y\}/g, "0")
        .replace(/\{z\}/g, "0");

      } else if (url && url.indexOf('http') == -1 && url.match(/(.*?)\.(.*)/).length == 3) {
        type = 'mapbox_id';

      } else { // If not, check https
        url = this._fixHTTPS(url);
      }

      if (type == 'mapbox') {

        this._successChooser({ tiles: [url] });

      } else if (type == "xyz") {

        var image = new Image();

        image.onload = function(e) {
          self._successChooser({
            tiles: [self._lowerXYZ($input.val())]
          })
        }

        image.onerror = this._errorChooser;
        image.src = url;

      } else if (type == "mapbox_id") {

        var image = new Image();

        image.onload = function(e) {
          self._successChooser({
            tiles: [self._lowerXYZ($input.val())]
          })
        }

        image.onerror = this._errorChooser;

        var match = url.match(/(.*?)\.(.*)/);
        url = this._MAPBOX.base + "v" + this._MAPBOX.version + "/" + match[1] + "." + match[2] + "/0/0/0.png";

        image.src = url;

      } else { // type json

        $.ajax({
          type: "GET",
          url: url,
          dataType: 'jsonp',
          success: this._successChooser,
          error: this._errorChooser
        });
      }
    },

    _lowerXYZ: function(url) {
      return url.replace(/\{S\}/g, "{s}")
        .replace(/\{X\}/g, "{x}")
        .replace(/\{Y\}/g, "{y}")
        .replace(/\{Z\}/g, "{z}");
    },

    /**
     * Click on OK button
     */
    ok: function(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();

      if (this.model.get("enabled")) {
        this.model.set("enabled", false);
        this._checkTileJson();
      }
    }
  });
