cdb.geo.ui.MobileLayer = cdb.core.View.extend({

  events: {
    'click .toggle':        "_toggle",
    // Rest infowindow bindings
    "dragstart":            "_stopPropagation",
    //"mousedown":            "_stopPropagation",
    "touchstart":           "_stopPropagation",
    "MSPointerDown":        "_stopPropagation",
    "dblclick":             "_stopPropagation",
    "DOMMouseScroll":       "_stopBubbling",
    'MozMousePixelScroll':  "_stopBubbling",
    "mousewheel":           "_stopBubbling",
    "dbclick":              "_stopPropagation"
  },

  tagName: "li",

  className: "cartodb-mobile-layer",

  template: cdb.core.Template.compile("<h3><%= layer_name %><a href='#' class='toggle'></a></h3>"),

  /**
   *  Stop event bubbling
   */
  _stopBubbling: function (e) {
    e.preventDefault();
    e.stopPropagation();
  },

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
 
  },

  _toggle: function(e) {

    e.preventDefault();
    e.stopPropagation();

    this.model.set("visible", !this.model.get("visible"))

  },

  _renderLegend: function() {

    if (this.model.get("legend") && this.model.get("legend").type == "none") return;

    this.$el.addClass("has-legend");

    var legend = new cdb.geo.ui.Legend(this.model.get("legend"));

    this.$el.append(legend.render().$el);

  },

  _truncate: function(input, length) {
    return input.substr(0, length-1) + (input.length > length ? '&hellip;' : '');
  },

  render: function() {


    var layer_name = this.model.get("layer_name");

    layer_name = this._truncate(layer_name, 23);

    var attributes = _.extend(this.model.attributes, { layer_name: layer_name });
    this.$el.html(this.template(attributes));

    if (!this.model.get("visible")) this.$el.addClass("hidden");
    if (this.model.get("legend"))   this._renderLegend();

    this._onChangeVisible();

    return this;
  }

});

cdb.geo.ui.Mobile = cdb.core.View.extend({

  className: "cartodb-mobile",

  events: {
    'click .toggle': "_toggle",
    'click .cartodb-attribution-button': '_onAttributionClick',
    'click .backdrop': '_onBackdropClick',
    "dragstart .backdrop":  '_onBackdropClick',
    "mousedown .backdrop":  '_onBackdropClick',
    "touchstart .backdrop": '_onBackdropClick'
    
    //"dragstart":      "_stopPropagation",
    //"mousedown":      "_stopPropagation",
    //"touchstart":     "_stopPropagation",
    //"MSPointerDown":  "_stopPropagation",
    //"dblclick":       "_stopPropagation",
    //"mousewheel":     "_stopPropagation",
    //"DOMMouseScroll": "_stopPropagation",
    //"click":          "_stopPropagation"
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

  _open: function() {

    this.$el.animate({ right: this.$el.find(".aside").width() }, 200)

  },

  _close: function() {

    this.$el.animate({ right: 0 }, 200)

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

  initialize: function() {

    _.bindAll(this, "_toggle");

    _.defaults(this.options, this.default_options);

    this.mapView = this.options.mapView;
    this.map     = this.mapView.map;

    window.mapView = this.mapView;

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/zoom');

    this.overlays = this.options.overlays;

    this.model = new Backbone.Model({
      open: false
    });

    this.model.on("change:open", this._onChangeOpen, this);

    window.addEventListener('orientationchange', _.bind(this.doOnOrientationChange, this));

  },

  _onChangeOpen: function() {
    this.model.get("open") ? this._open() : this._close();
  },

  open: function() {
    var self = this;

    this.$el.addClass("open");
    this.isOpen = true;
    this.$el.css("height", "110");

    this.recalc();
  },

  close: function() {

    var self = this;

    this.$el.removeClass("open");
    this.isOpen = false;

    this.$el.css("height", "40");

    this._fixTorque();

  },

  _fixTorque: function() {

    var self = this;

    setTimeout(function() {
      var w = self.$el.width() - self.$el.find(".toggle").width() - self.$el.find(".time").width();
      if (self.hasLegends) w -= 40;
      if (!self.hasLegends) w -= self.$el.find(".controls").width();
      self.$el.find(".slider-wrapper").css("width", w)
      self.$el.find(".slider-wrapper").show();

    }, 50);

  },

  _createLayer: function(_class, opts) {
    var layerView = new cdb.geo.ui[_class](opts);
    return layerView;
  },

  _getLayers: function() {

    this.layers = [];

    _.each(this.map.layers.models, this._getLayer, this);

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
          m.bind('change:visible', function(model) {
            this.trigger("change:visible", model.get('visible'), model.get('order'), model);
          }, this);

          m.set('layer_name', l.options.layer_name);

          console.log(l.options.layer_name);

          layerView = this._createLayer('LayerViewFromLayerGroup', {
            model: m,
            layerView: layerGroupView,
            layerIndex: i
          });

          this.layers.push(layerView.model);

        }
      } else if (layer.get("type") === "CartoDB" || layer.get('type') === 'torque') {
        var layerView = this._createLayer('LayerView', { model: layer });
        this.layers.push(layer);
        //layerView.bind('switchChanged', self._setCount, self);
        //model.bind('change:visible', function(model) {
          //this.trigger("change:visible", model.get('visible'), model.get('order'), model);
        //}, self);
      }
  },

  render:function() {

    this.$el.html(this.template(this.options));

    _.each(this.overlays, function(overlay) {

      if (overlay.type == 'search') {
        this._addSearch(overlay);
      }

      if (overlay.type == 'header') {
        this._addHeader(overlay);
      }

    }, this);

    this._addAttributions();

    this.$header = this.$el.find(".cartodb-header");
    this.$header.show();

    this._getLayers();
    this._renderLayers();

    this._renderTorque();

    //this.$el.find(".layers").jScrollPane();

    return this;

  },

  _renderTorque: function() {

    if (this.options.torqueLayer) {

      this.hasTorque = true;

      this.slider = new cdb.geo.ui.TimeSlider({type: "time_slider", layer: this.options.torqueLayer, map: this.options.map, pos_margin: 0, position: "none" , width: "auto" });

      this.slider.bind("time_clicked", function() {
        this.slider.toggleTime();
      }, this);

      this.$el.find(".torque").append(this.slider.render().$el);
      this.$el.addClass("with-torque");
    }

  },

  _renderLayers: function() {

    if (this.layers.length == 0) return;

    this.hasLayers = true;

    this.$el.addClass("with-layers");

    var msg = this.layers.length + " layer" + (this.layers.length != 1 ? "s" : "");

    if (!this.hasSearch) this.$el.find(".aside .layer-container").prepend("<h3>" + msg + "</h3>");

    _.each(this.layers, this._renderLayer, this);

  },

  _renderLayer: function(layer_data) {

    var layer = new cdb.geo.ui.MobileLayer({ model: layer_data });
    this.$el.find(".aside .layers").append(layer.render().$el);

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
      model: this.options.map
    });

    this.$el.find(".aside").prepend(search.render().$el);
    this.$el.find(".cartodb-searchbox").show();

  },

  _addHeader: function(overlay) {

    this.hasHeader = true;
    this.$header = this.$el.find(".cartodb-header");

    this.$el.addClass("with-header");

    var extra = overlay.options.extra;

    if (extra) {
      this.$title  = this.$header.find(".title").html(extra.title);
      this.$description  = this.$header.find(".description").html(extra.description);

      if (extra.show_title)       this.$title.show();
      if (extra.show_description) this.$description.show();
    }

  },

  _addAttributions: function() {

    var attributions = this.options.map.get("attribution");
    this.options.mapView.$el.find(".leaflet-control-attribution").hide();

    _.each(attributions, function(attribution) {
      var $li = $("<li></li>");
      var $el = $li.append($(attribution));
      this.$el.find(".cartodb-attribution").append($li);
    }, this);

    this.$el.find(".cartodb-attribution-button").fadeIn(250);

  }

});
