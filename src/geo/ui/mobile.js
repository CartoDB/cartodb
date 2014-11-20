cdb.geo.ui.MobileLayer = cdb.core.View.extend({

  events: {
    'click h3':    "_toggle",
    "dblclick":  "_stopPropagation"
  },

  tagName: "li",

  className: "cartodb-mobile-layer has-toggle",

  template: cdb.core.Template.compile("<% if (show_title) { %><h3><%= layer_name %><% } %><a href='#' class='toggle<%= toggle_class %>'></a></h3>"),

  /**
   *  Stop event propagation
   */
  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    this.model.bind("change:visible", this._onChangeVisible, this);

  },

  _onChangeVisible: function() {

    this.$el.find(".legend")[ this.model.get("visible") ? "fadeIn":"fadeOut"](150);
    this.$el[ this.model.get("visible") ? "removeClass":"addClass"]("hidden");

    this.trigger("change_visibility", this);

  },

  _toggle: function(e) {

    e.preventDefault();
    e.stopPropagation();

    if (this.options.hide_toggle) return;

    this.model.set("visible", !this.model.get("visible"))

  },

  _renderLegend: function() {

    if (!this.options.show_legends) return;

    if (this.model.get("legend") && (this.model.get("legend").type == "none" || !this.model.get("legend").type)) return;
    if (this.model.get("legend") && this.model.get("legend").items && this.model.get("legend").items.length == 0) return;

    this.$el.addClass("has-legend");

    var legend = new cdb.geo.ui.Legend(this.model.get("legend"));

    legend.undelegateEvents();

    this.$el.append(legend.render().$el);

  },

  _truncate: function(input, length) {
    return input.substr(0, length-1) + (input.length > length ? '&hellip;' : '');
  },

  render: function() {

    var layer_name = this.model.get("layer_name");

    layer_name = layer_name ? this._truncate(layer_name, 23) : "untitled";

    var attributes = _.extend(
      this.model.attributes,
      {
        layer_name:   this.options.show_title ? layer_name : "",
        toggle_class: this.options.hide_toggle ? " hide" : ""
      }
    );

    this.$el.html(this.template(_.extend(attributes, { show_title: this.options.show_title } )));


    if (this.options.hide_toggle)   this.$el.removeClass("has-toggle");
    if (!this.model.get("visible")) this.$el.addClass("hidden");
    if (this.model.get("legend"))   this._renderLegend();

    this._onChangeVisible();

    return this;
  }

});

cdb.geo.ui.Mobile = cdb.core.View.extend({

  className: "cartodb-mobile",

  events: {
    "click .cartodb-attribution-button": "_onAttributionClick",
    "click .toggle":                     "_toggle",
    "click .fullscreen":                 "_toggleFullScreen",
    "click .backdrop":                   "_onBackdropClick",
    "dblclick .aside":                   "_stopPropagation",
    "dragstart .aside":                  "_checkOrigin",
    "mousedown .aside":                  "_checkOrigin",
    "touchstart .aside":                 "_checkOrigin",
    "MSPointerDown .aside":              "_checkOrigin",
  },

  initialize: function() {

    _.bindAll(this, "_toggle", "_reInitScrollpane");

    _.defaults(this.options, this.default_options);

    this.hasLayerSelector = false;
    this.mobileEnabled = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    this.visibility_options = this.options.visibility_options || {};

    this.mapView  = this.options.mapView;
    this.map      = this.mapView.map;

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/zoom');
    this.overlays = this.options.overlays;

    this._setupModel();

    window.addEventListener('orientationchange', _.bind(this.doOnOrientationChange, this));

    this._addWheelEvent();

  },

  _addWheelEvent: function() {

      var self    = this;
      var mapView = this.options.mapView;

      $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange', function() {

        if ( !document.fullscreenElement && !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
          mapView.options.map.set("scrollwheel", false);
        }

        mapView.invalidateSize();

      });

  },

  _setupModel: function() {

    this.model = new Backbone.Model({
      open: false,
      layer_count: 0
    });

    this.model.on("change:open", this._onChangeOpen, this);
    this.model.on("change:layer_count", this._onChangeLayerCount, this);

  },

  /**
   *  Check event origin
   */
  _checkOrigin: function(ev) {
    // If the mouse down come from jspVerticalBar
    // dont stop the propagation, but if the event
    // is a touchstart, stop the propagation
    var come_from_scroll = (($(ev.target).closest(".jspVerticalBar").length > 0) && (ev.type != "touchstart"));

    if (!come_from_scroll) {
      ev.stopPropagation();
    }
  },

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  _onBackdropClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.$el.find(".backdrop").fadeOut(250);
    this.$el.find(".cartodb-attribution").fadeOut(250);

  },

  _onAttributionClick: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.$el.find(".backdrop").fadeIn(250);
    this.$el.find(".cartodb-attribution").fadeIn(250);

  },

  _toggle: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.model.set("open", !this.model.get("open"));

  },

  _toggleFullScreen: function(ev) {

    ev.stopPropagation();
    ev.preventDefault();

    var doc   = window.document;
    var docEl = $("#map > div")[0];

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen;
    var cancelFullScreen  = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen;

    var mapView = this.options.mapView;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement) {

      requestFullScreen.call(docEl);

      if (mapView) {

        mapView.options.map.set("scrollwheel", true);

      }

    } else {

      cancelFullScreen.call(doc);

    }
  },

  _open: function() {

    var right = this.$el.find(".aside").width();

    this.$el.find(".cartodb-header").animate({ right: right }, 200)
    this.$el.find(".aside").animate({ right: 0 }, 200)
    this.$el.find(".cartodb-attribution-button").animate({ right: right + parseInt(this.$el.find(".cartodb-attribution-button").css("right")) }, 200)
    this.$el.find(".cartodb-attribution").animate({ right: right + parseInt(this.$el.find(".cartodb-attribution-button").css("right")) }, 200)
    this._initScrollPane();

  },

  _close: function() {

    this.$el.find(".cartodb-header").animate({ right: 0 }, 200)
    this.$el.find(".aside").animate({ right: - this.$el.find(".aside").width() }, 200)
    this.$el.find(".cartodb-attribution-button").animate({ right: 20 }, 200)
    this.$el.find(".cartodb-attribution").animate({ right: 20 }, 200)

  },

  default_options: {
    timeout: 0,
    msg: ''
  },

  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  doOnOrientationChange: function() {

    switch(window.orientation)
    {
      case -90:
      case 90: this.recalc("landscape");
        break;
      default: this.recalc("portrait");
        break;
    }
  },

  recalc: function(orientation) {

    var height = $(".legends > div.cartodb-legend-stack").height();

    if (this.$el.hasClass("open") && height < 100 && !this.$el.hasClass("torque")) {

      this.$el.css("height", height);
      this.$el.find(".top-shadow").hide();
      this.$el.find(".bottom-shadow").hide();

    } else if (this.$el.hasClass("open") && height < 100 && this.$el.hasClass("legends") && this.$el.hasClass("torque")) {

      this.$el.css("height", height + $(".legends > div.torque").height() );
      this.$el.find(".top-shadow").hide();
      this.$el.find(".bottom-shadow").hide();

    }

  },

  _onChangeLayerCount: function() {

    var layer_count = this.model.get("layer_count");
    var msg = layer_count + " layer" + (layer_count != 1 ? "s" : "");
    this.$el.find(".aside .layer-container > h3").html(msg);

  },

  _onChangeOpen: function() {
    this.model.get("open") ? this._open() : this._close();
  },

  _createLayer: function(_class, opts) {
    return new cdb.geo.ui[_class](opts);
  },

  _getLayers: function() {

    this.layers = [];

    // we add the layers to the array depending on the method used
    // to sent us the layers
    if (this.options.layerView) {
      this._getLayersFromLayerView();
    } else {
      _.each(this.map.layers.models, this._getLayer, this);
    }

  },

  _getLayersFromLayerView: function() {

    if (this.options.layerView && this.options.layerView.model.get("type") == "layergroup") {

      this.layers = _.map(this.options.layerView.layers, function(l, i) {

        var m = new cdb.core.Model(l);

        m.set('order', i);
        m.set('type', 'layergroup');
        m.set('visible', l.visible);
        m.set('layer_name', l.options.layer_name);

        layerView = this._createLayer('LayerViewFromLayerGroup', {
          model: m,
          layerView: this.options.layerView,
          layerIndex: i
        });

        return layerView.model;

      }, this);

    } else if (this.options.layerView && (this.options.layerView.model.get("type") == "torque")) {

      var layerView = this._createLayer('LayerView', { model: this.options.layerView.model });

      this.layers.push(layerView.model);

    }
  },

  _getLayer: function(layer) {

    if (layer.get("type") == 'layergroup' || layer.get('type') === 'namedmap') {

      var layerGroupView = this.mapView.getLayerByCid(layer.cid);

      for (var i = 0 ; i < layerGroupView.getLayerCount(); ++i) {

        var l = layerGroupView.getLayer(i);
        var m = new cdb.core.Model(l);

        m.set('order', i);
        m.set('type', 'layergroup');
        m.set('visible', l.visible);
        m.set('layer_name', l.options.layer_name);

        layerView = this._createLayer('LayerViewFromLayerGroup', {
          model: m,
          layerView: layerGroupView,
          layerIndex: i
        });

        this.layers.push(layerView.model);

      }

    } else if (layer.get("type") === "CartoDB" || layer.get('type') === 'torque') {

      if (layer.get('type') === 'torque')  {
        layer.on("change:visible", this._toggleSlider, this);
      }

      this.layers.push(layer);

    }

  },

  _toggleSlider: function(m) {

    if (m.get("visible")) {
      this.$el.addClass("with-torque");
      this.slider.show();
    } else {
      this.$el.removeClass("with-torque");
      this.slider.hide();
    }

  },

  _reInitScrollpane: function() {
    this.$('.scrollpane').data('jsp') && this.$('.scrollpane').data('jsp').reinitialise();
  },

  _bindOrientationChange: function() {

    var self = this;

    var onOrientationChange = function() {
      $(".cartodb-mobile .scrollpane").css("max-height", self.$el.height() - 30);
      $('.cartodb-mobile .scrollpane').data('jsp') && $('.cartodb-mobile .scrollpane').data('jsp').reinitialise();
    };

    if (!window.addEventListener) {
      window.attachEvent('orientationchange', onOrientationChange, this);
    } else {
      window.addEventListener('orientationchange', _.bind(onOrientationChange));
    }

  },

  _renderOverlays: function() {

    var hasSearchOverlay  = false;
    var hasZoomOverlay    = false;
    var hasLayerSelector  = false;

    _.each(this.overlays, function(overlay) {

      if (!this.visibility_options.search && overlay.type == 'search') {
        if (this.visibility_options.search !== false && this.visibility_options.search !== "false") {
          this._addSearch();
          hasSearchOverlay = true;
        }
      }

      if (!this.visibility_options.zoomControl && overlay.type == 'zoom') {
        if (this.visibility_options.zoomControl !== "false") {
          this._addZoom();
          hasZoomOverlay = true;
        }
      }

      if (overlay.type == 'fullscreen' && !this.mobileEnabled) {
        this._addFullscreen();
      }

      if (overlay.type == 'header') {
        this._addHeader(overlay);
      }

      if (overlay.type == 'layer_selector') {
        hasLayerSelector = true;
      }

    }, this);

    var search_visibility = this.visibility_options.search === "true" || this.visibility_options.search === true;
    var zoom_visibility = this.visibility_options.zoomControl === "true" || this.visibility_options.zoomControl === true;
    var layer_selector_visibility  = this.visibility_options.layer_selector;

    if (!hasSearchOverlay && search_visibility) this._addSearch();
    if (!hasZoomOverlay   && zoom_visibility) this._addZoom();
    if (layer_selector_visibility || hasLayerSelector && layer_selector_visibility == undefined) this.hasLayerSelector = true;

  },

  _initScrollPane: function() {

    if (this.$scrollpane) return;

    var self = this;

    var height       = this.$el.height();
    this.$scrollpane = this.$el.find(".scrollpane");

    setTimeout(function() {
      self.$scrollpane.css("max-height", height - 60);
      self.$scrollpane.jScrollPane({ showArrows: true });
    }, 500);

  },

  _addZoom: function() {

    var template = cdb.core.Template.compile('\
    <a href="#zoom_in" class="zoom_in">+</a>\
    <a href="#zoom_out" class="zoom_out">-</a>\
    <div class="info"></div>', 'mustache'
    );

    var zoom = new cdb.geo.ui.Zoom({
      model: this.options.map,
      template: template
    });

    this.$el.append(zoom.render().$el);
    this.$el.addClass("with-zoom");

  },

  _addFullscreen: function() {

    if (this.visibility_options.fullscreen != false) {
      this.hasFullscreen = true;
      this.$el.addClass("with-fullscreen");
    }

  },

  _addSearch: function() {

    this.hasSearch = true;

    var template = cdb.core.Template.compile('\
      <form>\
      <span class="loader"></span>\
      <input type="text" class="text" placeholder="Search for places..." value="" />\
      <input type="submit" class="submit" value="" />\
      </form>\
      ', 'mustache'
    );

    var search = new cdb.geo.ui.Search({
      template: template,
      model: this.mapView.map
    });

    this.$el.find(".aside").prepend(search.render().$el);
    this.$el.find(".cartodb-searchbox").show();
    this.$el.addClass("with-search");

  },

  _addHeader: function(overlay) {

    this.hasHeader = true;

    this.$header = this.$el.find(".cartodb-header");

    var title_template = _.template('<div class="hgroup"><% if (show_title) { %><div class="title"><%= title %></div><% } %><% if (show_description) { %><div class="description"><%= description %><% } %></div></div>');

    var extra = overlay.options.extra;
    var has_header = false;
    var show_title = false, show_description = false;

    if (extra) {

      if (this.visibility_options.title || this.visibility_options.title != false && extra.show_title)      {
        has_header = true;
        show_title = true;
      }

      if (this.visibility_options.description || this.visibility_options.description != false && extra.show_description) {
        has_header = true;
        show_description = true;
      }

      var $hgroup = title_template({ 
        title: extra.title,
        show_title:show_title,
        description: extra.description,
        show_description: show_description 
      });

      if (has_header) {
        this.$el.addClass("with-header");
        this.$header.find(".content").append($hgroup);
      }

    }

  },

  _addAttributions: function() {

    var attributions = "";

    this.options.mapView.$el.find(".leaflet-control-attribution").hide(); // TODO: remove this from here

    if (this.options.layerView) {

      attributions = this.options.layerView.model.get("attribution");
      this.$el.find(".cartodb-attribution").append(attributions);

    } else if (this.options.map.get("attribution")) {

      attributions = this.options.map.get("attribution");

      _.each(attributions, function(attribution) {
        var $li = $("<li></li>");
        var $el = $li.html(attribution);
        this.$el.find(".cartodb-attribution").append($li);
      }, this);

    }

    if (attributions) {
      this.$el.find(".cartodb-attribution-button").fadeIn(250);
    }

  },

  _renderLayers: function() {

    var hasLegendOverlay = this.visibility_options.legends;

    var legends = this.layers.filter(function(layer) {
      return layer.get("legend") && layer.get("legend").type !== "none"
    });

    var hasLegends = legends.length ? true : false;

    if (!this.hasLayerSelector && !hasLegendOverlay) return;
    if (!this.hasLayerSelector && !hasLegends) return;
    if (this.layers.length == 0) return;
    if (this.layers.length == 1 && !hasLegends) return;

    this.$el.addClass("with-layers");

    this.model.set("layer_count", 0);

    if (!this.hasSearch) this.$el.find(".aside .layer-container").prepend("<h3></h3>");

    _.each(this.layers, this._renderLayer, this);

  },

  _renderLayer: function(data) {

    var hasLegend = data.get("legend") && data.get("legend").type !== "" && data.get("legend").type !== "none";

    // When the layer selector is disabled, don't show the layer if it doesn't have legends
    if (!this.hasLayerSelector && !hasLegend) return;
    if (!this.hasLayerSelector && !data.get("visible")) return;

    var hide_toggle = (this.layers.length == 1 || !this.hasLayerSelector);

    var show_legends = true;

    if (this.visibility_options && this.visibility_options.legends !== undefined) {
      show_legends = this.visibility_options.legends;
    }

    var layer = new cdb.geo.ui.MobileLayer({ 
      model: data,
      show_legends: show_legends,
      show_title: !this.hasLayerSelector ? false : true,
      hide_toggle: hide_toggle 
    });

    this.$el.find(".aside .layers").append(layer.render().$el);

    layer.bind("change_visibility", this._reInitScrollpane, this);

    this.model.set("layer_count", this.model.get("layer_count") + 1);

  },

  _renderTorque: function() {

    if (this.options.torqueLayer) {

      this.hasTorque = true;

      this.slider = new cdb.geo.ui.TimeSlider({type: "time_slider", layer: this.options.torqueLayer, map: this.options.map, pos_margin: 0, position: "none" , width: "auto" });

      this.slider.bind("time_clicked", function() {
        this.slider.toggleTime();
      }, this);

      this.$el.find(".torque").append(this.slider.render().$el);

      if (this.options.torqueLayer.hidden) this.slider.hide();
      else this.$el.addClass("with-torque");
    }

  },

  render:function() {

    this._bindOrientationChange();

    this.$el.html(this.template(this.options));

    this._renderOverlays();

    this._addAttributions();

    this.$header = this.$el.find(".cartodb-header");
    this.$header.show();

    this._getLayers();
    this._renderLayers();
    this._renderTorque();

    return this;

  }

});
