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
      "change input":     "_checkTileJson",
      "click .ok.button": "ok",
      "click .cancel":    "_cancel",
      "click .close":     "_cancel"
    },

    initialize: function() {

      _.bindAll(this, "_successChooser", "_errorChooser", "_showLoader", "_hideLoader");

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
      // End loader
      this._hideLoader();

      // Show error
      this.$el.find("input").addClass("error");
      this.$el.find("div.error").addClass("active");

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
        urlTemplate: data.tiles[0]
      });
      // do not save before add because the layer collection
      // has the correct url
      this.options.baseLayers.add(layer);
      layer.save();

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
        , self =    this;

      // Remove error
      $input.removeClass("error");
      this.$el.find(".error").removeClass("active");
      // Start loader
      this._showLoader();

      // Check if it is xyz
      if ( url.search("{x}") != -1) {
        url = url.replace(/\{x\}/g,"1").replace(/\{y\}/g,"1").replace(/\{z\}/g,"1")
      }

      url = this._fixHttps(url);

      $.ajax({
        type: "GET",
        url: url,
        dataType: 'jsonp',
        jsonpCallback: 'grid',
        success: this._successChooser,
        error: this._errorChooser
      });
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
