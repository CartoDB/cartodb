
  /**
   *  Shows a dialog to share a map view.
   *
   *  var share_view = new ShareDialog({
   *    vis: visualization_model,
   *    user: user_model
   *  })
   *
   *  - It needs an user and visualization model.
   */

  cdb.admin.ShareDialog = cdb.admin.BaseDialog.extend({

    _TEXTS: {
      title: _t('Publish your visualization'),
      close: _t('Close')
    },

    options: {
      vizjson_url: 'http://<%= host %>/api/v2/viz/<%= id %>/viz.json'
    },

    _KEYS: {
      _BITLY: {
        key: 'R_de188fd61320cb55d359b2fecd3dad4b',
        login: 'vizzuality'
      }
    },

    events: cdb.core.View.extendEvents({
      'click .copy ul li a' : '_onMethodClick',
      'click .input'  : '_onInputClick',
      'click .share'  : '_onShareClick'
    }),

    initialize: function() {
      this.options = _.extend({
        title: this._TEXTS.title,
        description: '',
        template_name: 'table/header/views/share_dialog_base',
        clean_on_hide: true,
        ok_button_classes: "button grey",
        ok_title: this._TEXTS.close,
        modal_type: "",
        width: 765,
        modal_class: 'share_dialog',
        map_title: this.options.vis.get('name'),
        map_description: this.options.vis.get('description'),
        removable_logo: this.options.user.get("actions").remove_logo,
        touch: (!!('ontouchstart' in window) || !!('onmsgesturechange' in window))
      }, this.options);

      // Do not use the same model than the big map
      this.map = this.options.vis.map.clone();

      // Create map options to use it in the map-share and the url-share
      this.mapOptions = new cdb.core.Model({
        title:            true,
        description:      true,
        search:           false,
        shareable:        true,
        cartodb_logo:     true,
        layer_selector:   this.map.layers.getTotalDataLayers() > 1 ? true : false,
        legends:          this.map.layers.getTotalDataLegends() > 0 ? true : false,
        scrollwheel:      true,
        sublayer_options: this._getSublayerOptions(),
        sql:              this.options.vis.map.get('dataLayer').get('query') || ''
      });

      // Show CartoDB logo in this case
      this.map.layers.each(function(layer) {
        if (layer.get('cartodb_logo') == false)
          layer.set('cartodb_logo', true);
      });

      // Bindings
      this.model = new cdb.core.Model();
      this.model.bind('change:url',    this._updateURL, this);
      this.model.bind('change:method', this._updateSelectedOption, this);

      this.map.bind('change', this._changeBounds, this);

      this.mapOptions.bind('change', this._onChangeMap, this);
      this.mapOptions.bind('change', this._changePreview, this);

      // Add related models
      this.add_related_model(this.map);
      this.add_related_model(this.mapOptions);

      this._enableCopy();

      this.constructor.__super__.initialize.apply(this);
    },

    _addWidget: function(widget) {
      this.addView(widget);
      this.$('.cartodb-map_wrapper').append(widget.render().$el);
    },

    _addZoomWidget: function() {

      var widget = new cdb.geo.ui.Zoom({
        model:    this.map,
        template: this.getTemplate("table/views/zoom_control")
      });

      this._addWidget(widget);

    },

    _addLayerWidget: function() {
      var widget = new cdb.geo.ui.LayerSelector({
        mapView: this.mapView,
        template: this.getTemplate("table/views/layer_selector"),
        dropdown_template: this.getTemplate("table/views/layer_dropdown")
      });

      widget.bind("switchChanged", this._updateSublayerOptions, this);

      this._addWidget(widget);
    },

    _addLegendWidget: function() {

      var legendWidget = new cdb.admin.mod.LegendWidget ({
        map: this.map
      });

      this._addWidget(legendWidget);

    },

    _addShareWidget: function() {

      this._setShortURL();

      var tableUrl = this.options.vis.embedURL(),
      opts     =  _.map(this.mapOptions.attributes, function(v, k) { return k + "=" + encodeURIComponent(v); }),
      origin   = "http://" + location.host; // share urls are always HTTP

      opts     = opts.join('&');
      opts     = opts.replace(/'/g, "%27"); // Encode the single quotes
      var url = origin + tableUrl + "?" + opts;

      var widget = this.shareDialogWidget = new cdb.ui.common.ShareDialog({
        model: this.map,
        className: 'cartodb-share-dialog',
        title: '',
        disableLinks: true,
        descriptionShort: '',
        facebook_url: "#",
        twitter_url: "#",
        code: "<iframe width='100%' height='520' frameborder='0' src='" + url + "'></iframe>",
        width: 430,
        template: this.getTemplate("table/views/share_dialog")
      });

      this._addWidget(widget);

    },

    _addSearchWidget: function() {

      var widget = new cdb.geo.ui.Search({
        model:    this.map,
        template: this.getTemplate("table/views/search_control")
      });

      this._addWidget(widget);
    },

    _addSwitches: function(switches) {

      var self = this;

      _(switches).each(function(prop) {
        var className = '.' + prop;

        var sw = new cdb.forms.Switch({
          model: self.mapOptions,
          property: prop
        });

        self.addView(sw);

        self.$(className).append(sw.render().el);
      });

    },

    _addMapView: function() {
      var self = this;

      setTimeout(function() {
        var mapViewClass = cdb.admin.LeafletMapView;

        if (self.map.get('provider') === 'googlemaps') {
          mapViewClass = cdb.admin.GoogleMapsMapView;
        }

        var el = $('<div>').addClass('cartodb-map');

        self.$('.cartodb-map_wrapper').prepend(el);

        self.mapView = new mapViewClass({
          el: el,
          map: self.map
        });

        self.addView(self.mapView);

        self._addLayerWidget();
        self._addLegendWidget();

        // trigger this change to set map bounds in the url that are get from mapView
        self.map.trigger('change');
        // Being added layer-selector and legend change preview map checking
        // if they have to be showed.
        self._changePreview();
      }, 300);

    },

    _getSublayerOptions: function() {

      var layers = this.map.layers.filter(function(lyr) {
        return _.contains(['CartoDB', 'torque'], lyr.get('type'));
      });

      return _.map(layers, function(layer) {
        return layer.get("visible");
      }).join("|").replace(/false/g, 0).replace(/true/g, 1);

    },

    _updateSublayerOptions: function() {
      var sublayer_options = this._getSublayerOptions();
      this.mapOptions.set("sublayer_options", sublayer_options);
    },

    _showTorqueWarning: function() {
      var layers = this.map.layers.getLayersByType('torque');
      if (layers.length) {
        this.$('.torque_warning').fadeIn();
      }
    },

    render_content: function() {
      this._addZoomWidget();
      this._addSearchWidget();
      this._addShareWidget();
      this._addSwitches(['title', 'description', 'search', 'shareable', 'cartodb_logo', 'layer_selector', 'legends', 'scrollwheel']);
      this._addMapView();
      this._showTorqueWarning();

      // Set default method
      this.model.set("method", "url");

      // Send mixpanel event
      cdb.god.trigger('mixpanel', 'Click Publish Visualization');
      cdb.god.trigger('mixpanel_people', {'publish_visualization_last_clicked': new Date()});

      return this;

    },

    _onShareClick: function(e) {
      this.shareDialogWidget.toggle();
    },

    _onInputClick: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var $input =  $(e.target).find("input")[0] ? $(e.target).find("input") : $(e.target)

      $input.select();

    },

    _onMethodClick: function(e) {
      e.preventDefault();
      e.stopPropagation();

      var $link  = $(e.target);
      var method = $link.attr("data-method");

      this.model.set("method", method);
    },

    _updateURL: function(obj, url) {
      $url = this.$('.url');

      if (url === "") {
        $url.addClass('loading');
      } else {
        $url.removeClass('loading');
      }

      if ($url.is('input')) {
        this.$('.url').val(url);
      } else {
        this.$('.url').text(url);
      }
    },

    _updateSelectedOption: function(obj, method) {

      this.$el.find(".copy .input ul li.selected").removeClass("selected");
      this.$el.find(".copy .input ul li a[data-method='" + method + "']").parent().addClass("selected");

      if      (method == "url")   this._setShortURL();
      else if (method == "embed") this._setEmbedURL();
      else if (method == "api")   this._setAPIURL();

    },

    /*
     * Enables copy functionality.
     */
    _enableCopy: function(active) {
      var self = this;

      setTimeout(function() { // Hack for ZeroClipboard, it doesn't like effects :S
        self.$el.find("a.copy").zclip({
          path: "/assets/ZeroClipboard.swf",
          copy: function(){
            return $(this).parent().find("input").val();
          }
        })
      }, 500);

      // Tipsy tooltip ready!
      this.$el.find(".zclip")
      .tipsy({
        gravity: 's',
        live: true,
        fade: true,
        title: function() {
          return _t("Copy this");
        }
      });

      // Prevent url hash error
      this.$el.find("a.tooltip").click(function(ev) {
        ev.preventDefault();
      });
    },

    _setAPIURL: function() {
      var opts = { host: location.host, id: this.options.vis.get('id') };
      var url = _.template(this.options.vizjson_url)(opts);
      this.model.set("url", url);
    },

    _onChangeMap: function() {
      var self = this;

      var method = this.model.get("method");

      if      (method == "embed") this._setEmbedURL();
      else if (method == "url")  {

        clearTimeout(this.pid);

        this.pid = setTimeout(function() {

          self._setShortURL();

        }, 500);
      }

    },

    _setEmbedURL: function() {

      if (this.model.get("method") != "embed") return;

      var tableUrl = this.options.vis.embedURL()
        , opts =  _.map(this.mapOptions.attributes, function(v, k) {
          return k + "=" + encodeURIComponent(v);
            })
        , self = this;

      opts = opts.join('&');

      var origin = "http://" + location.host;

      var url = "<iframe width='100%' height='520' frameborder='0' src='" + origin + tableUrl + "?" + opts + "'></iframe>";

      if ($url.is('input')) {
        this.$('.url').val(url);
      } else {
        this.$('.url').text(url);
      }

      this.model.set("url", url);

    },

    _setShortURL: function() {
      var self = this;

      if (!this.localStorage) this.localStorage = new cdb.admin.localStorage('cartodb_urls');

      var
      tableUrl = this.options.vis.embedURL(),
      opts     =  _.map(this.mapOptions.attributes, function(v, k) { return k + "=" + encodeURIComponent(v); }),
      origin   = "http://" + location.host; // share urls are always HTTP

      opts     = opts.join('&');
      opts     = opts.replace(/'/g, "%27"); // Encode the single quotes

      var url = origin + tableUrl + "?" + opts;

      // If we already have retrieved this url, set it. if not, fetch from bitly
      var storedShortURL = this.localStorage.search(url);

      if (storedShortURL) {
        this.model.set("url", storedShortURL);
      } else {
        this._requestShortURL(url);
      }

    },

    _setSQL: function() {
      var sql = this.options.map.get('dataLayer').get('query') || '';
      this.mapOptions.set({
        sql: sql
      });
    },

    _changeBounds: function() {
      var self = this;
      var bounds = self.map.getViewBounds();
      if(bounds) {
        if(self.map.getZoom() <= 3) {
          self.mapOptions
          .unset('sw_lat')
          .unset('sw_lon')
          .unset('ne_lat')
          .unset('ne_lon')
          var c = self.map.get('center');
          self.mapOptions.set({
            zoom: self.map.getZoom(),
            center_lat: c[0],
            center_lon: c[1]
          });
        } else {
          self.mapOptions
          .unset('zoom')
          .unset('center_lon')
          .unset('center_lat')
          self.mapOptions.set({
            sw_lat: bounds[0][0],
            sw_lon: bounds[0][1],
            ne_lat: bounds[1][0],
            ne_lon: bounds[1][1]
          });
        }
      }
    },

    // change the map preview showing how it will look
    _changePreview: function() {

      var title        = this.mapOptions.get('title')
        , description    = this.mapOptions.get('description')
        , shareable      = this.mapOptions.get('shareable')
        , search         = this.mapOptions.get('search')
        , layer_selector = this.mapOptions.get('layer_selector')
        , legends        = this.mapOptions.get('legends')
        , scrollwheel    = this.mapOptions.get('scrollwheel')
        , cartodb_logo   = this.mapOptions.get('cartodb_logo');

      var $title          = this.$('div.cartodb-header h1');
      var $description    = this.$('div.cartodb-header p');
      var $social         = this.$('div.cartodb-header div.share');
      var $search         = this.$('div.cartodb-searchbox');
      var $layer_selector = this.$('div.cartodb-layer-selector-box');
      var $legends        = this.$('div.cartodb-legends');
      var $logo           = this.$('div.cartodb-logo');
      var $cartodb_text   = this.$('div.cartodb-text');

      function toggle(condition, $el, show_callback, hide_callback) {
        condition ? $el.fadeIn(250) : function() { $el.fadeOut(250); hide_callback && hide_callback();}()
      }

      var self = this;

      toggle(title, $title);
      toggle(description, $description);
      toggle(shareable, $social, null, function($el) { self.shareDialogWidget.hide(); });
      toggle(search, $search);
      toggle(layer_selector, $layer_selector);
      toggle(legends, $legends);
      toggle(cartodb_logo, $logo);
      // this.$('div.cartodb-logo')[cartodb_logo ? 'show':'hide']();

      if (!title && !description && !shareable) {
        this.$('div.cartodb-header').fadeOut(200);
      } else {
        this.$('div.cartodb-header').fadeIn(200);
      }

      // If logo is not showed, some elements need to be moved
      // or hiden
      this.$('div.cartodb-map_wrapper')[cartodb_logo ? 'removeClass' : 'addClass']('no-logo')

      var self = this;

      // Check map position if the properties change
      // (we use a timeout to wait for the cartodb-header fadeOut transition)
      setTimeout(function() {
        self._setMapPosition();
      }, 300);

      if (!scrollwheel) this.map.disableScrollWheel();
      else this.map.enableScrollWheel();
    },

    // Don't positionate the map below the header, just check
    // if it is visible or not and then calculate the necessary px
    _setMapPosition: function() {
      var header_h = this.$('div.cartodb-header').is(":visible")
      ? this.$('div.cartodb-header').outerHeight()
      : 0;

      this.$("div.cartodb-map").css({
        top: header_h
      });
    },

    _requestShortURL: function(url) {
      var self = this;

      this.model.set("url", '');

      $.ajax({
        url:"https://api-ssl.bitly.com/v3/shorten?longUrl=" + encodeURIComponent(url)+ "&login=" + this._KEYS._BITLY.login + "&apiKey=" + this._KEYS._BITLY.key,
        type:"GET",
        async: false,
        dataType: 'jsonp',
        success:  function(res) {
          self._onRequestShortURLSuccess(res, url);
        },
        error: function(e) {
          self._onRequestShortURLError(url);
        }
      });
    },

    _onRequestShortURLSuccess: function(res, url) {
      if(this.model.get("method") === 'url') {
        if(res.status_code && res.status_code == "200") {
          var obj = {};
          obj[url] = 'http://cdb.io/'+ res.data.hash;
          this.localStorage.add(obj);
          this.model.set("url", obj[url]);
        } else {
          this.model.set("url", url);
        }

      }
    },

    _onRequestShortURLError: function(url) {
      this.model.set("url", url);
    },

    open: function(options) {
      var self = this;

      this.trigger("will_open", this);

      this.$el.find(".modal:eq(0)").css({
        "opacity": "0",
        "marginTop": "170px"
      });

      this.$el.find(".mamufas:eq(0)").fadeIn();

      if (options && options.center) {

        this.$el.find(".modal:eq(0)").animate({
          top: "50%",
          marginTop: -this.$el.find(".modal:eq(0)").height()>>1,
          opacity: 1
        }, 300);

      } else {

        this.$el.find(".modal:eq(0)").animate({
          marginTop: "120px",
          opacity: 1
        }, 300);
      }
    },
  });
