(function() {
/**
 * shows a dialog to share a map view
 * new ShareMapDialog({
 *  table: table_model
 * })
 *
 */
cdb.admin.ShareMapDialog = cdb.admin.BaseDialog.extend({

  _BITLY_LOGIN: 'vizzuality',
  _BITLY_KEY: 'R_de188fd61320cb55d359b2fecd3dad4b',

  events: cdb.core.View.extendEvents({
    'click .copy ul li a' : '_onMethodClick',
    'click .input'  : '_onInputClick'
  }),

  initialize: function() {

    this.options = _.extend({
      title: _t("Publish your visualization"),
      description: '',
      template_name: 'table/views/share_map_dialog_base',
      clean_on_hide: true,
      ok_button_classes: "button grey",
      ok_title: "Close",
      modal_type: "",
      width: 765,
      modal_class: 'map_share_dialog',
      map_title: this.options.table.get('name'),
      map_description: this.options.table.get('description') || "",
      special_user: (this.options.user.account_type.toLowerCase() == "coronelli" && !config.custom_com_hosted)

    }, this.options);

    // Create map options to use it in the map-share and the url-share
    this.mapOptions = new cdb.core.Model({
      title:          true,
      description:    true,
      search:         false,
      shareable:      false,
      cartodb_logo:   true,
      layer_selector: true,
      scrollwheel:    true,
      sql:            this.options.map.get('dataLayer').get('query') || ''
    });

    // Do not use the same model than the big map
    this.map = this.options.map.clone();

    // Show CartoDB logo in this case
    this.map.layers.map(function(layer) {
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

    this.options.table.bind('change:dataSource', this._setSQL, this);

    // Add related models
    this.add_related_model(this.options.map);
    this.add_related_model(this.options.table);

    this._enableCopy();

    this.origin = 'http://' + location.host;
    this.sql    = this.options.map.get('dataLayer').get('query') || '';

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

    /* TODO: retrieve real layers */
    var layers = new cdb.geo.ui.Layers([
      new cdb.geo.ui.Layer({ name: "Hi!"}),
      new cdb.geo.ui.Layer({ name: "Layer cake"}),
      new cdb.geo.ui.Layer({ name: "Wadus layer"}),
      new cdb.geo.ui.Layer({ name: "Little layer"})
    ]);

    var widget = new cdb.geo.ui.LayerSelector({
      model: this.map,
      layers: layers,
      template: this.getTemplate("table/views/layer_selector"),
      dropdown_template: this.getTemplate("table/views/layer_dropdown")
    });

    window.layer_selector = widget;
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
      var mapViewClass = cdb.geo.LeafletMapView;

      if (self.map.get('provider') === 'googlemaps') {
        mapViewClass = cdb.geo.GoogleMapsMapView;
      }

      var el = $('<div>').addClass('cartodb-map');

      this.$('.cartodb-map_wrapper').prepend(el);

      self.mapView = new mapViewClass({
        el: el,
        map: self.map
      });

      self.addView(self.mapView);

      // trigger this change to set map bounds in the url that are get from mapView
      self.map.trigger('change');

    }, 300);

  },

  render_content: function() {

    this._addZoomWidget();
    this._addSearchWidget();
    this._addLayerWidget();
    this._addSwitches(['title', 'description', 'search', 'shareable', 'cartodb_logo', 'layer_selector', 'scrollwheel']);
    this._addMapView();

    // Set default method
    this.model.set("method", "url");

    return this;

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
    this.$el.find('input.url').val(url);
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
    var url = this.origin + '/api/v1/viz/' + this.options.table.get("id") + '/viz.json';
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

    var tableUrl = this.options.table.embedURL()
    , opts =  _.map(this.mapOptions.attributes, function(v, k) {
      return k + "=" + encodeURIComponent(v);
    })
    , self = this;

    // default height
    var script_id = "cartodb-" + new Date().getTime();
    opts = opts.concat(['height=400', "id=" + script_id]);

    opts = opts.join('&');

    var origin = "http://" + location.host;

    var url = "<script id='" + script_id + "' src='" + origin + tableUrl + ".js" + "?" + opts + "'></script>";
    this.$('input.url').val(url);
    this.model.set("url", url);

  },

  _setShortURL: function() {
    var self = this;

    if (!this.localStorage) this.localStorage = new cdb.admin.localStorage('cartodb_urls');

    var
    tableUrl = this.options.table.embedURL(),
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
    , scrollwheel    = this.mapOptions.get('scrollwheel')
    , cartodb_logo   = this.mapOptions.get('cartodb_logo');

    var $title          = this.$('div.cartodb-header h1');
    var $description    = this.$('div.cartodb-header p');
    var $social         = this.$('div.cartodb-header div.social');
    var $search         = this.$('div.cartodb-searchbox');
    //TODO: change layer_selector_box to cartodb-layer-selector-box
    var $layer_selector = this.$('div.layer_selector_box');
    var $logo           = this.$('a.cartodb_logo');

    function toggle(condition, $el) {
      condition ? $el.fadeIn(250) : $el.fadeOut(250);
    }

    toggle(title, $title);
    toggle(description, $description);
    toggle(shareable, $social);
    toggle(search, $search);
    toggle(layer_selector, $layer_selector);

    this.$('a.cartodb_logo')[cartodb_logo ? 'show':'hide']();

    if (!title && !description && !shareable) {
      this.$('div.cartodb-header').fadeOut(200);
    } else {
      this.$('div.cartodb-header').fadeIn(200);
    }

    var that = this;

    // Check map position if the properties change
    // (we use a timeout to wait for the cartodb-header fadeOut transition)
    setTimeout(function() {
      that._setMapPosition();
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

    this.model.set("url", 'Generating...');

    $.ajax({
      url:"https://api-ssl.bitly.com/v3/shorten?longUrl=" + encodeURIComponent(url)+ "&login=" + this._BITLY_LOGIN + "&apiKey=" + this._BITLY_KEY,
      type:"GET",
      async: false,
      dataType: 'jsonp',
      success:  function(res) {
        self._onRequestShortURLSuccess(res, url);
      },
      error:    this._onRequestShortURLError
    });

  },

  _onRequestShortURLSuccess: function(res, url) {
    var obj = {}
    obj[url] = 'http://cdb.io/'+ res.data.hash;
    this.localStorage.add(obj);
    this.model.set("url", obj[url]);
  },

  _onRequestShortURLError: function() {
    urlText = url;
  }

});

cdb._test = cdb._test || {};

})();


