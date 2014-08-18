cdb.geo.ui.MobileLayer = cdb.core.View.extend({

  events: {
    'click .toggle': "_toggle"
  },

  tagName: "li",

  className: "cartodb-mobile-layer",

  template: cdb.core.Template.compile("<h3><%= layer_name %><a href='#' class='toggle'></a></h3>"),

  initialize: function() {

    _.defaults(this.options, this.default_options);

  },

  _toggle: function(e) {

    e.preventDefault();
    e.stopPropagation();

  },

  _renderLegend: function() {

    this.$el.addClass("has_legend");

    var legend = new cdb.geo.ui.Legend(this.options.legend);

    this.$el.append(legend.render().$el);

  },

  render: function() {

    this.$el.html(this.template(this.options));

    if (this.options && !this.options.visible) this.$el.addClass("hidden");

    if (this.options && this.options.legend) this._renderLegend();

    return this;
  }

});

cdb.geo.ui.Mobile = cdb.core.View.extend({

  className: "cartodb-mobile",

  events: {
    'click .toggle': "_toggle"
    /*'click .toggle': '_toggle',
    "dragstart":      "_stopPropagation",
    "mousedown":      "_stopPropagation",
    "touchstart":     "_stopPropagation",
    "MSPointerDown":  "_stopPropagation",
    "dblclick":       "_stopPropagation",
    "mousewheel":     "_stopPropagation",
    "DOMMouseScroll": "_stopPropagation",
    "click":          "_stopPropagation"*/
  },

  _toggle: function(e) {

    e.preventDefault();
    e.stopPropagation();

    console.log(1, this.model.get("open"))
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
    
    this.map = this.model;
    this.layers = [];

    this.template = this.options.template ? this.options.template : cdb.templates.getTemplate('geo/zoom');

    this.layers   = this.options.layers;
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

  _getLayers: function() {
    var self = this;
    this.layers = [];

    _.each(this.map.layers.models, function(layer) {

      if (layer.get("type") == 'layergroup' || layer.get('type') === 'namedmap') {
        var layerGroupView = self.mapView.getLayerByCid(layer.cid);
        for (var i = 0 ; i < layerGroupView.getLayerCount(); ++i) {
          var l = layerGroupView.getLayer(i);
          var m = new cdb.core.Model(l);
          m.set('order', i);
          m.set('type', 'layergroup');

          m.set('visible', !layerGroupView.getSubLayer(i).get('hidden'));
          m.bind('change:visible', function(model) {
            this.trigger("change:visible", model.get('visible'), model.get('order'), model);
          }, self);

          if(self.options.layer_names) {
            m.set('layer_name', self.options.layer_names[i]);
          } else {
            m.set('layer_name', l.options.layer_name);
          }

          var layerView = self._createLayer('LayerViewFromLayerGroup', {
            model: m,
            layerView: layerGroupView,
            layerIndex: i
          });
          layerView.bind('switchChanged', self._setCount, self);
          self.layers.push(layerView);
        }
      } else if (layer.get("type") === "CartoDB" || layer.get('type') === 'torque') {
        var layerView = self._createLayer('LayerView', { model: layer });
        layerView.bind('switchChanged', self._setCount, self);
        self.layers.push(layerView);
        layerView.model.bind('change:visible', function(model) {
          this.trigger("change:visible", model.get('visible'), model.get('order'), model);
        }, self);
      }

    });
  },

  render:function() {

    this._getLayers();

    this.$el.html(this.template(this.options));

    _.each(this.overlays, function(overlay) {
      if (overlay.type == 'header') {
        this._addHeader(overlay);
      }
    }, this);

    this._renderLayers();

    return this;

  },

  _renderLayers: function() {

    this.$el.find(".aside .layers").prepend("<h3>" + this.layers.length + " layers</h3>")

    _.each(this.layers, this._renderLayer, this);

  },

  _renderLayer: function(layer_data) {

    var layer = new cdb.geo.ui.MobileLayer(layer_data);
    this.$el.find(".aside .layers ul").append(layer.render().$el);

  },

  _addHeader: function(overlay) {

    this.$header = this.$el.find(".cartodb-header");
    this.$title  = this.$header.find(".title").html("hola");

    this.$header.show();
    this.$title.show();
  },

  render_old: function() {

    this.$el.html(this.template(this.options));
    var width = $(document).width() - 40;
    this.$el.css( { width: width })

    if (this.options.torqueLayer) {

      this.hasTorque = true;

      this.slider = new cdb.geo.ui.TimeSlider({type: "time_slider", layer: this.options.torqueLayer, map: this.options.map, pos_margin: 0, position: "none" , width: "auto" });

      this.slider.bind("time_clicked", function() {
        this.slider.toggleTime();
      }, this);

      this.$el.find(".torque").append(this.slider.render().$el);
      this.$el.addClass("torque");
      this.$el.find(".slider-wrapper").hide();

    }

    if (this.options.legends) {

      this.$el.find(".legends").append(this.options.legends.render().$el);

      var visible = _.some(this.options.legends._models, function(model) {
        return model.get("template") || (model.get("type") != 'none' && model.get("items").length > 0)
      });

      if (visible) {
        this.$el.addClass("legends");
        this.hasLegends = true;
        this.$el.find(".controls").hide();
      }

    }

    if (this.hasTorque && !this.hasLegends) {
      this.$el.find(".toggle").hide();
    }

    if (this.hasTorque) this._fixTorque();

    return this;
  }

});
