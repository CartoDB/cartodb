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
      "focusin input":    "_focusIn",
      "focusout input":   "_focusOut",
      "click .ok.button": "ok",
      "click .cancel":    "_cancel",
      "click .close":     "_cancel"
    },

    initialize: function() {

      _.bindAll(this, "_checkTileJson", "_successChooser", "_errorChooser", "_showLoader", "_hideLoader");

      var self = this;

      _.extend(this.options, {
        title: _t("Add your basemap"),
        description: _t("Add your MapBox, TMS or WMS maps"),
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
      // Add correct html
      var $content = this.$content = $("<div>");
      this.temp_content = cdb.templates.getTemplate('table/views/basemap_chooser_dialog');
      $content.append(this.temp_content());

      this.tabs = new cdb.admin.Tabs({
        el: $content.find('.dialog-tabs')
      });
      this.addView(this.tabs);

      this.mapboxPane = new cdb.admin.BaseMapChooserPane({
        template: cdb.templates.getTemplate('table/views/basemap_chooser'),
        chosen: 'Mapbox',
        type: 'mapbox'
      });
      this.addView(this.mapboxPane);

      this.tmsPane = new cdb.admin.BaseMapChooserPane({
        template: cdb.templates.getTemplate('table/views/basemap_chooser'),
        chosen: 'TMS',
        type: 'tms'
      });
      this.addView(this.tmsPane);

      this.wmsPane = new cdb.admin.BaseMapChooserPane({
        template: cdb.templates.getTemplate('table/views/basemap_chooser'),
        chosen: 'WMS',
        type: 'wms'
      });
      this.addView(this.wmsPane);


      this.panes = new cdb.ui.common.TabPane({
        el: $content.find(".basemap-chooser-panes")
      });
      this.panes.addTab('mapbox', this.mapboxPane);
      this.panes.addTab('wms', this.tmsPane);
      this.panes.addTab('tms', this.wmsPane);
      this.panes.active('mapbox');
      this.addView(this.panes);

      this.tabs.linkToPanel(this.panes);

      $content.append(this.panes.render());

      console.log(this.$el.find('input'));
      return this.$content;
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
     *  Style box when user focuses in/out over the input
     */
    _focusIn: function(ev) {
      $(ev.target).closest('div.input').addClass('active')
    },
    _focusOut: function(ev) {
      $(ev.target).closest('div.input').removeClass('active')
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

      // Check if the respond is an array
      // In that case, get only the first
      if (_.isArray(data) && _.size(data) > 0) {
        data = _.first(data);
      }

      var layer = new cdb.admin.TileLayer({
        urlTemplate:  data.tiles[0],
        attribution:  data.attribution || null,
        maxZoom:      data.maxzoom     || 21,
        minZoom:      data.minzoom     || 0,
        name:         data.name        || ''
      });

      // Set the className from the urlTemplate of the basemap
      layer.set("className", layer._generateClassName(data.tiles[0]));

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
    _fixHTTPS: function(url, loc) {
      loc = loc || location;

      // fix the url to https or http
     if(url.indexOf('https') !== 0 && loc.protocol === 'https:') {
        // search for mapping
        var i = url.indexOf('mapbox.com');
        if(i != -1) {
          return this.MAPBOX_HTTPS + url.substr(i + 'mapbox.com'.length);
        }
        return url.replace(/http/, 'https');
      }
      return url;
    },


    transformMapboxUrl: function(url) {

      var mapboxBase = 'http://tiles.mapbox.com/v3/';
      var urlData = url.split('tiles.mapbox.com/');

      if (urlData.length > 1) {
        var userMapData = urlData[1].split('/');

        if (userMapData.length > 2) {
          var user = userMapData[0];
          var map  = userMapData[2];

          return mapboxBase + user + '.' + map + '/{z}/{x}/{y}.png'
        }
      }

      return url;
    },

    /**
     * this function checks that the url is correct and tries to get the tilejson
     */
    _checkTileJson: function(ev) {

      var $input      = this.$el.find('input')
      , url         = this._lowerXYZ($input.val())
      , self        = this
      , type        = 'json'
      , subdomains  = ['a', 'b', 'c'];

      // Remove error
      $input.removeClass("error");
      this.$el.find(".error").removeClass("active");

      // Start loader
      this._showLoader();

      // Disable input
      $input.attr("disabled");

      // Detects the URL's type (mapbox, xyz or json)

      if (url.indexOf('{x}') < 0 && url.indexOf('http://tiles.mapbox.com') != -1) {

        type = "mapbox";
        url = this.transformMapboxUrl(url);

      } else if (url.indexOf("{x}") != -1) {

        type = 'xyz';

        url = url.replace(/\{s\}/g,function(){
          return subdomains[ Math.floor(Math.random()*3) ]
        })
        .replace(/\{x\}/g,"0")
        .replace(/\{y\}/g,"0")
        .replace(/\{z\}/g,"0");

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

      } else { // type json

        $.ajax({
          type: "GET",
          url: url,
          dataType: 'jsonp',
          success: this._successChooser,
          error:   this._errorChooser
        });
      }

    },

    _lowerXYZ: function(url) {
      return url
      .replace(/\{S\}/g,"{s}")
      .replace(/\{X\}/g,"{x}")
      .replace(/\{Y\}/g,"{y}")
      .replace(/\{Z\}/g,"{z}");
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
