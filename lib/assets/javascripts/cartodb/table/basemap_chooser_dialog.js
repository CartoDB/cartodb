(function() {
  /**
   * shows a dialog to choose another base map
   * new BaseMapChooser({})
   *
   */
  cdb.admin.BaseMapAdder = cdb.admin.BaseDialog.extend({
    _WAITING_INPUT_TIME: 1000,
    events: {
      "keydown input":    "_resetChooser",
      "keydown input":    "userKeyPress",
      "change input":     "_checkTileJson",
      "click .ok.button": "ok",
      "click .cancel":    "_cancel",
      "click .close":     "_cancel"
    },

    initialize: function() {

      _.bindAll(this, "_successChooser", "userKeyPress", "_errorChooser", "_showLoader", "_hideLoader");

      var self = this;

      _.extend(this.options, {
        title: _t("Add your basemap"),
        description: _t('Insert below the tileJSON or XYZ url of your basemaps.'),
        clean_on_hide: true,
        cancel_button_classes: "margin15",
        ok_button_classes: "button grey disabled",
        ok_title: _t("Add basemap"),
        modal_type: "compressed",
        width: 512,
        modal_class: 'basemap_chooser_dialog',
        spinner_ops: {
          lines: 9,
          length: 0,
          width: 4,
          radius: 6,
          corners: 1,
          rotate: 0,
          color: '#000',
          speed: 1,
          trail: 60,
          shadow: false,
          hwaccel: false,
          className: 'spinner',
          zIndex: 2e9,
          top: '0',
          left: '0'
        }
      });

      this.constructor.__super__.initialize.apply(this);

      this.enable = false;
      this.tilejson = null;
    },


    render_content: function() {
      return this.getTemplate('table/views/basemap_chooser_dialog')();
    },

    /**
    * Triggered when the user press a key on the url input, saves
    * when it was pressed and delays the finished typing check for
    * _WAITING_INPUT_TIME milliseconds.
    * @method userKeyPress
    * @param ev {event}
    */
    userKeyPress: function(ev) {
      var self = this;
      this.lastKeyDown = new Date();
      setTimeout(function() {
        self.checkUserFinishedTyping(ev)
      }, this._WAITING_INPUT_TIME);
    },

    /**
    * Check if have passed more than _WAITING_INPUT_TIME milliseconds and,
    * if so, check the correctness of the entered url
    * @method checkUserFinishedTyping
    * @param ev {event}
    */
    checkUserFinishedTyping : function(ev) {
      var now = new Date;
      if(now - this.lastKeyDown > (this._WAITING_INPUT_TIME - 10)) {
        this._checkTileJson(ev)
      }
    },

    /**
     * Reset the chooser
     */
    _resetChooser: function(ev) {
      // If it is a enter... nothing
      var code = (ev.keyCode ? ev.keyCode : ev.which);
      if(code != 13) {
        // End loader
        this._hideLoader();

        // Hide error
        this.$el.find("input").removeClass("error");
        this.$el.find("div.error").removeClass("active");

        // Enable dialog? nop!
        this.$el.find("a.button.ok").addClass("disabled");
        this.enable = false;
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
      this.$el.find("a.button.ok").addClass("disabled");
      this.enable = false;
    },


    /**
     * If the url is valid
     */
    _successChooser: function(data) {
      // Save the tilejson
      this.tilejson = data;

      // End loader
      this._hideLoader();

      // Active dialog
      this.$el.find("a.button.ok").removeClass("disabled");
      this.enable = true;
    },


    /**
     * Show loader
     */
    _showLoader: function() {
      // Get spin target
      var spin_target = this.$el.find("div.loader")[0];

      this.spin = new Spinner(this.options.spinner_ops).spin(spin_target);

      $(spin_target).show();
    },


    /**
     * Hide loader
     */
    _hideLoader: function() {
      if (this.spin)
        this.spin.stop();
      this.$el.find("div.loader").hide();
    },

    /**
     * return a https url if the current application is loaded form https
     */
    _fixHttps: function(url, loc) {
      loc = loc || location;
      // fix the url to https or http
      if(url.search('https') !== 0 && loc.protocol === 'https:') {
        return url.replace(/http/, 'https');
      }
      return url;
    },


    /**
     * this function has to check the url is correct and try to get
     * the tilejson
     */
    _checkTileJson: function(ev) {
      var url = $(ev.target).val()
        , self = this;

      // Enable? nop
      this.enable = false;

      // Remove error
      this.$el.find("input").removeClass("error");
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
      ev.preventDefault();
      var self = this;

      if (this.enable) {
        var layer = new cdb.admin.TileLayer({
          urlTemplate: self.tilejson.tiles[0]
        });
        // do not save before add because the layer collection
        // has the correct url
        this.options.baseLayers.add(layer);
        layer.save();

        this.hide();
        this.options.ok && this.options.ok(layer);
      }
    }
  });


})();
