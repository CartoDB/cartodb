cdb.admin.overlays.MobileLayers = cdb.core.View.extend({

  className: "layer-container",

  template:  cdb.core.Template.compile('<div class="scrollpane"><ul class="layers"></ul></div>'),

  initialize: function() {

    this.layers = [];
    this.layerViews = [];

    this.model = new Backbone.Model({
      layer_count: 0,
      show_title: this.options.show_title,
      force_hidden_title: this.options.force_hidden_title,
      show_layer_selector: this.options.show_layer_selector,
      show_legends: this.options.show_legends || false
    });

    this.model.on("change:layer_count", this._onChangeLayerCount, this);
    this.model.on("change:show_title", this._onChangeShowTitle, this);
    this.model.on("change:show_legends", this._onChangeShowLegends, this);
    this.model.on("change:show_layer_selector", this._onChangeShowLayerSelector, this);

    this.map = this.options.map;
    this.mapView = this.options.mapView;

    this.map.layers.on("change", function() {
      this._reloadLayers();
    }, this);

    _.each(this.map.layers.models, this._getLayer, this);

  },

  getLayerCount: function() {
    return this.layerViews.length;
  },

  _onChangeShowLayerSelector: function() {
    this._reloadLayers();
  },

  _onChangeShowLegends: function() {
    this._reloadLayers();
  },

  _onChangeLayerCount: function() {

    var layerCount = this.model.get("layer_count");

    if (layerCount === 0) {
      this.trigger("hide-layers", this);
      if (!this.model.get("force_hidden_title")) this.model.set("show_title", false);
    } else {
      this.trigger("show-layers", this);
      var msg = layerCount + " layer" + (layerCount != 1 ? "s" : "");
      this.$el.find(" > h3").text(msg)
      if (!this.model.get("force_hidden_title")) this.model.set("show_title", true);
    }

  },

  _onChangeShowTitle: function() {

    if (this.model.get("show_title")) this._showTitle();
    else this._hideTitle();

  },

  _addTitle: function() {
    var layerCount = this.model.get("layer_count");
    var msg = layerCount + " layer" + (layerCount != 1 ? "s" : "");
    this.$el.prepend("<h3>" + msg + "</h3>");
    if (!this.model.get("show_title")) this.$el.find("> h3").hide();
  },

  showTitle: function(force) {

    if (force) this.model.set("force_hidden_title", false);
    this.model.set("show_title", true);

  },

  hideTitle: function(force) {

    if (force) this.model.set("force_hidden_title", true);

    this.model.set("show_title", false);

  },

  _showTitle: function() {
    this.$el.find("> h3").show();
  },

  _hideTitle: function() {
    this.$el.find("> h3").hide();
  },

  showLayerSelector: function() {
    this.model.set("show_layer_selector", true);
  },

  hideLayerSelector: function() {
    this.model.set("show_layer_selector", false);
  },

  toggleLegends: function() {
    this.model.set("show_legends", !this.model.get("show_legends"));
  },

  _getLayer: function(layer) {
    if (layer.get("type") === "CartoDB" || layer.get('type') === 'torque') {
      this.layers.push(layer);
    }
  },

  _renderLayer: function(data) {

    var hasLegend = data.legend && data.legend.get("type") !== "" && data.legend.get("type") !== "none";

    var showLayerSelector = this.model.get("show_layer_selector");
    var showLegends       = this.model.get("show_legends");

    var layer = new cdb.admin.overlays.MobileLayer({
      model: data,
      show_legends: showLegends,
      show_title:   showLayerSelector,
      hide_toggle: !showLayerSelector
    });

    if (layer.model.get("type") === "torque" && layer.model.get("visible")) {
      var torqueLayer = this._getTorqueLayer();
      this.trigger("add-torque", torqueLayer);
    }

    // Let's see if we should render the layer
    if (!showLayerSelector && !showLegends) return;
    if (!showLayerSelector && !hasLegend) return;
    if (!showLayerSelector && !data.get("visible")) return;

    if (data.wizard_properties) {
      data.wizard_properties.off("change", this._onChangeWizardProperties, this);
      data.wizard_properties.on("change", this._onChangeWizardProperties, this);
    }

    this.layerViews.push(layer);

    this.addView(layer);

    this.$el.find(".layers").append(layer.render().$el);

    layer.bind("change_visibility", this._reInitScrollpane, this);

  },

  _onChangeWizardProperties: function(model) {
    this._reloadLayers();
  },

  _getTorqueLayer: function() {

    var layer = this.map.layers.getLayersByType('torque')[0];

    if (layer) {
      return this.mapView.getLayerByCid(layer.cid);
    }

  },

  _reloadLayers: function() {

    this.layers = [];

    _.each(this.map.layers.models, this._getLayer, this);

    this._removeTorque();
    this._removeLayers();
    this._renderLayers();

  },

  _removeTorque: function() {
    this.trigger("remove-torque", this);
  },

  _removeLayers: function() {

    _.each(this.layerViews, function(layer) {
      layer.clean();
    }, this);

    this.layerViews = [];

  },

  _renderLayers: function() {

    _.each(this.layers, this._renderLayer, this);

    this.model.set("layer_count", this.layerViews.length);

    this._reInitScrollpane();

  },

  _reInitScrollpane: function() {
    this.$('.scrollpane').data('jsp') && this.$('.scrollpane').data('jsp').reinitialise();
  },

  render: function() {

    this.$el.append(this.template);

    this._renderLayers();

    this._addTitle();

    return this;
  }

});

cdb.admin.overlays.MobileHeader = cdb.core.View.extend({

  className: "hgroup",

  template: _.template('<% if (show_title) { %><div class="title"><%- title %></div><% } %><% if (show_description) { %><div class="description"><%- description %><% } %></div>'),

  initialize: function() {

    var extra = this.model.get("extra");

    this.model.on("change:title", this._onChangeTitle, this);
    this.model.on("change:description", this._onChangeDescription, this);

    this.model.on("change:show_title", this._onChangeShowTitle, this);
    this.model.on("change:show_description", this._onChangeShowDescription, this);

  },

  _onChangeShowTitle: function() {
    this.render();
  },

  _onChangeShowDescription: function() {
    this.render();
  },

  _onChangeTitle: function() {
    this.render();
  },

  _onChangeDescription: function() {
    this.render();
  },

  render: function() {

    var extra = this.model.get("extra");

    var showTitle       = false;
    var showDescription = false;

    if (extra.title && extra.show_title) {
      showTitle = true;
    }

    if (extra.description && extra.show_description) {
      showDescription = true;
    }

    this.$el.html(this.template({
      title: extra.title,
      show_title:showTitle,
      description: extra.description,
      show_description: showDescription
    }));

    return this;

  }

});

cdb.admin.overlays.MobileLayer = cdb.core.View.extend({

  tagName: "li",

  events: {
    'click h3':    "_toggle",
    "dblclick":  "_stopPropagation"
  },

  className: "cartodb-mobile-layer",

  template: cdb.core.Template.compile("<% if (show_title) { %><h3><span><%- layer_name %></span><% } %><a href='#' class='toggle<%- toggle_class %>'></a></h3>"),

  /**
   *  Stop event propagation
   */
  _stopPropagation: function(ev) {
    ev.stopPropagation();
  },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    this.model.on("change:table_name_alias", this._onChangeLayerName, this);
    this.model.on("change:visible", this._onChangeVisible, this);

    if (this.model.legend) {

      this.model.legend.off("add change remove", this._reloadLegend, this);
      this.model.legend.on("add change remove", this._reloadLegend, this);

    }

  },

  _onChangeLayerName: function() {

    this.$el.find("h3 span", this._getLayerName());

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

  _reloadLegend: function() {

    this.$el.removeClass("has-legend");

    if (this.legend) {
      this.legend.clean();
      delete this.legend;
    }

    this._renderLegend();

  },

  _renderLegend: function() {

    if (!this.options.show_legends) return;

    if (this.model.legend && (this.model.legend.get("type") === "none" || !this.model.legend.get("type"))) return;
    if (this.model.legend && this.model.legend.get("items") && this.model.legend.get("items").length === 0) return;

    this.$el.addClass("has-legend");

    this.legend = new cdb.geo.ui.Legend({ model: this.model.legend });

    this.addView(this.legend);

    this.legend.undelegateEvents();

    this.$el.append(this.legend.render().$el);

  },

  _truncate: function(input, length) {
    return input.substr(0, length-1) + (input.length > length ? '&hellip;' : '');
  },

  _getLayerName: function() {
    return this.model.get("table_name_alias") || this.model.get("table_name");
  },

  render: function() {

    var attributes = _.extend(this.model.attributes, {
      show_title: this.options.show_title,
      layer_name: this._getLayerName(),
      toggle_class: this.options.hide_toggle ? " hide" : ""
    });

    this.$el.html(this.template(attributes));

    if (!this.model.get("visible")) this.$el.addClass("hidden");
    if (this.model.get("legend"))   this._renderLegend();

    this._onChangeVisible();

    return this;
  }

});

cdb.admin.overlays.Mobile = cdb.core.View.extend({

  className: "cartodb-mobile",

  template_name: "table/views/mobile",

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

    this.visibility_options = this.options.visibility_options || {};

    this.mapView = this.options.mapView;
    this.map     = this.mapView.map;

    this.map.on("change:legends", this._toggleLegends, this);

    this.template = this.options.template ? this.options.template : this.getTemplate(this.template_name);

    this._bindOverlays();

    this.model = new Backbone.Model({
      open: false,
      show_layer_selector: false
    });

    this.model.on("change:open", this._onChangeOpen, this);

  },

  show: function() {
    this.$el.fadeIn(250);
  },

  hide: function() {
    this.$el.fadeOut(250);
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

  _toggleLegends: function(){
    this.layers.toggleLegends();
  },

  _toggleFullScreen: function(ev) {

    ev.stopPropagation();
    ev.preventDefault();

    var doc   = window.document;
    var docEl = doc.documentElement;

    if (this.options.doc) { // we use a custom element
      docEl = $(this.options.doc)[0];
    }

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen;
    var cancelFullScreen  = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen;

    var mapView = this.options.mapView;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement) {

      requestFullScreen.call(docEl);

      if (mapView) {

        if (this.model.get("allowWheelOnFullscreen")) {
          mapView.options.map.set("scrollwheel", true);
        }

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

  _bindOverlays: function() {

    this.overlays = this.options.overlays;

    this.overlays.on("add", function() {
      this._resetOverlays();
    }, this);

    this.overlays.on("remove", function() {
      this._resetOverlays();
    }, this);

  },

  _onChangeOpen: function() {
    this.model.get("open") ? this._open() : this._close();
  },

  _createLayer: function(_class, opts) {
    return new cdb.geo.ui[_class](opts);
  },

  _reInitScrollpane: function() {
    this.$('.scrollpane').data('jsp') && this.$('.scrollpane').data('jsp').reinitialise();
  },

  _removeOverlays: function() {
    this._removeLayerSelector();
    this._removeHeader();
    this._removeSearch();
    this._removeFullscreen();
  },

  _resetOverlays: function() {
    this._removeOverlays();
    this._renderOverlays();

    if (!this.model.get("show_layer_selector") && !this.model.get("show_search") && !this.map.get("legends")) this.model.set("open", false);
    if (this.layers.layers.length === 0 && !this.model.get("search")) this.model.set("open", false);

  },

  _renderOverlays: function() {

    _.each(this.overlays.models, function(overlay) {

      var overlayType = overlay.get("type");

      if (overlayType === 'search') {
        this._addSearch(overlay);
      }

      if (overlayType === 'layer_selector') {
        this._addLayerSelector();
      }

      if (overlayType === 'fullscreen') {
        this._addFullscreen(overlay);
      }

      if (overlayType === 'header') {
        this._addHeader(overlay);
      }

    }, this);

  },

  render:function() {

    this.$el.html(this.template(this.options));

    this._renderOverlays();

    this._addAttributions();

    this._addLayers();

    return this;

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

  _removeLayerSelector: function() {
    this.model.set("show_layer_selector", false);
    if (this.layers) this.layers.hideLayerSelector();
  },

  _addLayerSelector: function(overlay) {
    this.model.set("show_layer_selector", true);
    if (this.layers) this.layers.showLayerSelector();
  },

  _addFullscreen: function(overlay) {
    this.$el.addClass("with-fullscreen");
  },

  _addSearch: function(overlay) {

    this.model.set("show_search", true);

    this.search = new cdb.geo.ui.Search({
      template: this.getTemplate("table/views/search_control"),
      model: this.options.map,
      mapView: this.options.mapView
    });

    this.addView(this.search);

    this.$el.addClass("with-search");
    this.$el.find(".aside").prepend(this.search.render().$el);
    this.search.$el.find("input[type='text']").attr("placeholder", "Search for places…");

    if (this.layers) this.layers.hideTitle(true);

  },

  _addHeader: function(overlay) {

    this.header = new cdb.admin.overlays.MobileHeader({ model: overlay });
    this.addView(this.header);

    this.$el.addClass("with-header");
    this.$el.find(".cartodb-header .content").append(this.header.render().$el);

  },

  _removeFullscreen: function() {
    this.$el.removeClass("with-fullscreen");
  },

  _removeSearch: function() {

    this.model.set("show_search", false);

    this.$el.removeClass("with-search");

    if (this.search) {
      this.search.clean();
      delete this.search;
    }

    if (this.layers) this.layers.showTitle();

  },

  _removeHeader: function() {

    this.$el.removeClass("with-header");

    if (this.header) {
      this.header.clean();
      delete this.header;
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

  _removeLayers: function() {

    this.$el.removeClass("with-layers");

    if (this.layers) {
      this.layers.clean();
      delete this.layers;
    }

  },

  _addLayers: function() {

    this.layers = new cdb.admin.overlays.MobileLayers({
      map: this.map,
      mapView: this.mapView,
      show_legends: this.map.get("legends"),
      show_title: !this.model.get("show_search"),
      force_hidden_title: this.model.get("show_search"),
      show_layer_selector: this.model.get("show_layer_selector")
    });

    this.layers.bind("remove-torque", function(torqueLayer) {
      this._removeTorque();
    }, this);

    this.layers.bind("add-torque", function(torqueLayer) {
      this._addTorqueLayer(torqueLayer);
    }, this);

    this.layers.bind("show-layers", function() {
      this.$el.addClass("with-layers");
    }, this);

    this.layers.bind("hide-layers", function() {
      this.$el.removeClass("with-layers");
    }, this);

    this.addView(this.layers);

    this.$el.find(".aside").append(this.layers.render().$el);

  },

  _removeTorque: function() {

    this.$el.removeClass("with-torque");

    if (this.slider) {
      this.slider.clean();
      this.slider = null;
    }
  },

  _addTorqueLayer: function(layer) {

    this.slider = new cdb.geo.ui.TimeSlider({type: "time_slider", layer: layer, map: this.options.map, pos_margin: 0, position: "none" , width: "auto" });

    this.addView(this.slider);

    this.slider.bind("time_clicked", function() {
      this.slider.toggleTime();
    }, this);

    this.$el.find(".torque").append(this.slider.render().$el);
    this.$el.addClass("with-torque");

  }

});
