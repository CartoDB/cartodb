
  /**
   *  Mapbox pane for basemap chooser
   */

  cdb.admin.MapboxBasemapChooserPane = cdb.admin.BasemapChooserPane.extend({
    className: "basemap-pane",

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

    _hideLoader: function() {
      this.$el.find("div.loader").hide();
    },

    _showLoader: function() {
      this.$el.find("div.loader").show();
    },

    _hideError: function() {
      this.$el.find("input").removeClass("error");
      this.$("div.info").removeClass("error active")
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
      if (!access_token) {
        return this._errorChooser('Error retrieving your basemap. Please, check your access token.');
      }

      this._hideError();
      this._showLoader();
      var $input = this.$('input');
      $input.attr('disabled');

      var self = this;
      var mf = new cdb.editor.MapboxToTileLayerFactory({
        url: val,
        accessToken: access_token
      });
      mf.createTileLayer({
        success: function(tileLayer) {
          var urlTemplate = tileLayer.get('urlTemplate');
          var name = tileLayer._generateClassName(urlTemplate);
          if (_.include(self.options.layer_ids, name)) {
            self._errorChooser('This basemap is already added.');
          } else {
            self.trigger('successChooser', tileLayer, urlTemplate);
          }
        },
        error: function(errorMsg) {
          self._errorChooser(errorMsg);
        }
      });
    },

    /**
     * If the url is not valid
     */
    _errorChooser: function(message) {
      var $input = this.$("input");

      // End loader
      this._hideLoader();

      // Show error
      this.$(".info p").html(message);
      this.$("input").addClass("error");
      this.$("div.info").addClass("error active");

      // Enable input
      $input.attr("disabled");

      // Enable dialog? nop!
      this.trigger('errorChooser', '', this);
    }
  });
