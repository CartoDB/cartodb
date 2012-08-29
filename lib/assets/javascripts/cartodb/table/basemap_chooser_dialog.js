(function() {
  /**
   * shows a dialog to choose another base map
   * new BaseMapChooser({})
   * 
   */
  cdb.admin.BaseMapAdder = cdb.admin.BaseDialog.extend({

    events: {
      "keydown input":    "_resetChooser",
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
      return this.getTemplate('table/views/basemap_chooser_dialog')();; 
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

      // Start loader
      this._showLoader();

      // Check if it is xyz
      if ( url.search("{x}") != -1) {
        url = url.replace(/\{x\}/g,"1").replace(/\{y\}/g,"1").replace(/\{z\}/g,"1")
      }

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
        this.options.baseLayers.add(new cdb.admin.TileLayer({
          urlTemplate: self.tilejson.tiles[0]
        }));

        this.hide();
      }
    }
  });


})();
