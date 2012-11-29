(function() {
  /**
   * shows a dialog to choose another base map
   * new BaseMapChooser({})
   *
   */
  cdb.admin.BaseMapAdder = cdb.admin.BaseDialog.extend({

    MAPBOX_HTTPS: 'https://dnv9my2eseobd.cloudfront.net',

    _WAITING_INPUT_TIME: 1000,

    events: {
      "keydown input":    "_checkEnter",
      "click .ok.button": "ok",
      "click .cancel":    "_cancel",
      "click .close":     "_cancel"
    },

    initialize: function() {

      _.bindAll(this, "_checkTileJson", "_successChooser", "_errorChooser", "_showLoader", "_hideLoader");

      var self = this;

      _.extend(this.options, {
        title: _t("Add your basemap"),
        description: _t(""),
        clean_on_hide: true,
        cancel_button_classes: "margin15",
        ok_button_classes: "button grey",
        ok_title: _t("Add basemap"),
        modal_type: "compressed",
        width: 512,
        modal_class: 'basemap_chooser_dialog'
      });

      this.constructor.__super__.initialize.apply(this);

      this.enable = true;
      this.tilejson = null;
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
      if(code == 13) {
        this.killEvent(ev);
        this.ok();
      }
    },


    /**
     * If the url is not valid
     */
    _errorChooser: function(e) {
      var $input = this.$el.find("input");

      // End loader
      this._hideLoader();

      // Show error
      $input.addClass("error");
      this.$el.find("div.error").addClass("active");
      // Enable input
      $input.attr("disabled");

      // Enable dialog? nop!
      this.$el.find("a.button.ok").removeClass("disabled");
      this.enable = true;
    },


    /**
     * If the url is valid
     */
    _successChooser: function(data) {
      // End loader
      this._hideLoader();

      var layer = new cdb.admin.TileLayer({
        urlTemplate:  data.tiles[0],
        attribution:  data.attribution || null,
        maxZoom:      data.maxzoom || 21,
        minZoom:      data.minzoom || 0,
        name:         data.name || ''
      });
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
      // Get spin target
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
    _fixHttps: function(url, loc) {
      loc = loc || location;

      // fix the url to https or http
     if(url.search('https') !== 0 && loc.protocol === 'https:') {
        // search for mapping
        var i = url.indexOf('mapbox.com');
        if(i != -1) {
          return this.MAPBOX_HTTPS + url.substr(i + 'mapbox.com'.length);
        }
        return url.replace(/http/, 'https');
      }
      return url;
    },


    /**
     * this function has to check the url is correct and try to get
     * the tilejson
     */
    _checkTileJson: function(ev) {
      var $input =  this.$el.find('input') 
        , url =     $input.val()
        , self =    this
        , type =    'json';

      // Remove error
      $input.removeClass("error");
      this.$el.find(".error").removeClass("active");
      // Start loader
      this._showLoader();
      // Disable input
      $input.attr("disabled");

      // Check if it is xyz
      if ( url.search("{x}") != -1) {
        url = url.replace(/\{x\}/g,"0").replace(/\{y\}/g,"0").replace(/\{z\}/g,"0")
        type = 'xyz';
      }

      url = this._fixHttps(url);


      if (type == "xyz") {
        // Type xyz
        var image = new Image();
        image.onload = function(e) {
          self._successChooser({
            tiles: [$input.val()]
          })
        }
        image.onerror = this._errorChooser;
        image.src = url;
      } else {
        // Type json
        $.ajax({
          type: "GET",
          url: url,
          dataType: 'jsonp',
          success: this._successChooser,
          error: this._errorChooser
        });
      }
    },


    /**
     * Click on OK button
     */
    ok: function(ev) {
      if (ev && ev.preventDefault) ev.preventDefault();
        
      if (this.enable) {
        this.enable = false;
        this._checkTileJson();  
      }
    }
  });
})();
