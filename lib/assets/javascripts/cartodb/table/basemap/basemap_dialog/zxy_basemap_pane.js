
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
      _.bindAll(this, "_errorChooser", "_warningChooser", "_onInputChange", "_checkInput");

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
        this._checkInput(val);
      }
    },

    _checkInput: function(val) {
      try {
        var layer = cdb.admin.TileLayer.byCustomURL(val);
      } catch(e) {
        this._hideError();
        return; // abort
      }

      this._showLoader();
      this._checkTile(layer);
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
      this.$el.find("input").removeClass("warning");
      this.$("div.info").removeClass("warning active")

      this.$el.find("input").removeClass("error");
      this.$("div.info").removeClass("error active")
    },

    _showWarning: function(message) {

      if (typeof message == "object" || !message) message = "We couldn't validate this URL. If you're sure it contains data, go on and click on 'Add Basemap'";

      this.$(".info p").html(message);
      this.$el.find("input").removeClass("error");
      this.$el.find("div.info").removeClass("error");

      this.$el.find("input").addClass("warning");
      this.$el.find("div.info").addClass("warning active");

    },

    _showError: function(error) {

      if (typeof error == "object" || !error) error = "This URL is not valid.";

      this.$(".info p").html(error);
      this.$el.find("input").addClass("error");
      this.$el.find("div.info").addClass("error active");

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
      this._hideError();
      this._showLoader();
      this.$('input').attr("disabled");

      try {
        var layer = cdb.admin.TileLayer.byCustomURL(val);
      } catch (e) {
        this._errorChooser();
        return;
      }

      this._successChooser(layer);
    },

    _checkTile: function(layer) {
      var self = this;
      layer.validateTemplateURL({
        success: function() {
          self._hideError();
          self._hideLoader();
        },
        error: function() {
          self._warningChooser();
        }
      });
    },

    _successChooser: function(layer) {
      var url = layer.get('urlTemplate');
      var name = layer._generateClassName(url);

      if (_.include(this.options.layer_ids, name)) {
        this._errorChooser("This basemap is already added.");
        return;
      }

      this.trigger('successChooser', layer, url);
    },

    /**
     * If the url is not valid
     */
    _warningChooser: function(message) {
      this._hideLoader();
      this._showWarning(message);
      this.$el.find("input").attr("disabled");
      this.trigger('errorChooser');
    },

    /**
     * If the url is not valid
     */
    _errorChooser: function(message) {
      this._hideLoader();
      this._showError(message);
      this.$el.find("input").attr("disabled");
      this.trigger('errorChooser');
    }
  });
