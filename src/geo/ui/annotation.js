cdb.geo.ui.Annotation = cdb.core.View.extend({

  className: "cartodb-overlay overlay-annotation",

  defaults: {
    minZoom: 0,
    maxZoom: 40,
    style: {
      textAlign: "left",
      zIndex: 5,
      color: "#ffffff",
      fontSize: "13",
      fontFamilyName: "Helvetica",
      boxColor: "#333333",
      boxOpacity: 0.7,
      boxPadding: 10,
      lineWidth: 50,
      lineColor: "#333333"
    }
  },

  template: cdb.core.Template.compile(
    '<div class="content">\
    <div class="text widget_text">{{{ text }}}</div>\
    <div class="stick"><div class="ball"></div></div>\
    </div>',
    'mustache'
  ),

  events: {
    "click": "stopPropagation"
  },

  stopPropagation: function(e) {
    e.stopPropagation();
  },

  initialize: function() {

    this.template = this.options.template || this.template;
    this.mapView  = this.options.mapView;

    this.mobileEnabled = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    this._cleanStyleProperties(this.options.style);

    _.defaults(this.options.style, this.defaults.style);

    this._setupModels();

    this._bindMap();

  },

  _setupModels: function() {

    this.model = new cdb.core.Model({ 
      display: true,
      hidden: false,
      text:    this.options.text,
      latlng:  this.options.latlng,
      minZoom: this.options.minZoom || this.defaults.minZoom,
      maxZoom: this.options.maxZoom || this.defaults.maxZoom
    });

    this.model.on("change:display", this._onChangeDisplay, this);
    this.model.on("change:text",    this._onChangeText, this);
    this.model.on('change:latlng',  this._place, this);

    this.model.on('change:minZoom',  this._applyZoomLevelStyle, this);
    this.model.on('change:maxZoom',  this._applyZoomLevelStyle, this);

    this.style = new cdb.core.Model(this.options.style);

    this.style.on("change", this._applyStyle, this);

    this.add_related_model(this.style);

  },

  _bindMap: function() {

    this.mapView.map.bind('change', this._place, this);
    this.mapView.map.bind('change:zoom', this._applyZoomLevelStyle, this);
    this.mapView.bind('zoomstart', this.hide, this);
    this.mapView.bind('zoomend', this.show, this);

  },

  _unbindMap: function() {

    this.mapView.map.unbind('change', this._place, this);
    this.mapView.map.unbind('change:zoom', this._applyZoomLevelStyle, this);
    this.mapView.unbind('zoomstart', this.hide, this);
    this.mapView.unbind('zoomend', this.show, this);

  },

  _onChangeDisplay: function() {

    if (this.model.get("display")) this.show();
    else this.hide();

  },

  _onChangeText: function() {
    this.$el.find(".text").html(this._sanitizedText());
  },

  _sanitizedText: function() {
    return cdb.core.sanitize.html(this.model.get("text"), this.model.get('sanitizeText'));
  },

  _getStandardPropertyName: function(name) {

    if (!name) return;
    var parts = name.split("-");

    if (parts.length === 1) return name;
    else if (parts.length === 2) {
      return parts[0] + parts[1].slice(0, 1).toUpperCase() + parts[1].slice(1);
    }

  },

  _cleanStyleProperties: function(hash) {

    var standardProperties = {};

    _.each(hash, function(value, key) {
      standardProperties[this._getStandardPropertyName(key)] = value;
    }, this);

    this.options.style = standardProperties;

  },

  _belongsToCanvas: function() {
  
    var mobile = (this.options.device === "mobile") ? true : false;
    return mobile === this.mobileEnabled;
  },

  show: function(callback) {

    if (this.model.get("hidden") || !this._belongsToCanvas()) return;

    var self = this;

    this.$el.css({ opacity: 0, display: "inline-table" }); // makes the element to behave fine in the borders of the screen
    this.$el.stop().animate({ opacity: 1 }, { duration: 150, complete: function() {
      callback && callback();
    }});

  },

  hide: function(callback) {
    this.$el.stop().fadeOut(150, function() {
      callback && callback();
    });
  },

  _place: function() {

    var latlng     = this.model.get("latlng");

    var lineWidth  = this.style.get("lineWidth");
    var textAlign  = this.style.get("textAlign");

    var pos        = this.mapView.latLonToPixel(latlng);

    if (pos) {

      var top        = pos.y - this.$el.height()/2;
      var left       = pos.x + lineWidth;

      if (textAlign === "right") {
        left = pos.x - this.$el.width() - lineWidth - this.$el.find(".ball").width();
      }

      this.$el.css({ top: top, left: left });

    }

  },

  setMinZoom: function(zoom) {

    this.model.set("minZoom", zoom);

  },

  setMaxZoom: function(zoom) {

    this.model.set("maxZoom", zoom);

  },

  setPosition: function(latlng) {

    this.model.set("latlng", latlng);

  },

  setText: function(text) {

    this.model.set("text", text);

  },

  setStyle: function(property, value) {

    var standardProperty = this._getStandardPropertyName(property);

    if (standardProperty) {
      this.style.set(standardProperty, value);
    }

  },

  _applyStyle: function() {

    var textColor  = this.style.get("color");
    var textAlign  = this.style.get("textAlign");
    var boxColor   = this.style.get("boxColor");
    var boxOpacity = this.style.get("boxOpacity");
    var boxPadding = this.style.get("boxPadding");
    var lineWidth  = this.style.get("lineWidth");
    var lineColor  = this.style.get("lineColor");
    var fontFamily = this.style.get("fontFamilyName");

    this.$text = this.$el.find(".text");

    this.$text.css({ color: textColor, textAlign: textAlign });

    this.$el.find(".content").css("padding", boxPadding);
    this.$text.css("font-size", this.style.get("fontSize") + "px");
    this.$el.css("z-index", this.style.get("zIndex"));

    this.$el.find(".stick").css({ width: lineWidth, left: -lineWidth });

    var fontFamilyClass = "";

    if      (fontFamily  == "Droid Sans")       fontFamilyClass = "droid";
    else if (fontFamily  == "Vollkorn")         fontFamilyClass = "vollkorn";
    else if (fontFamily  == "Open Sans")        fontFamilyClass = "open_sans";
    else if (fontFamily  == "Roboto")           fontFamilyClass = "roboto";
    else if (fontFamily  == "Lato")             fontFamilyClass = "lato";
    else if (fontFamily  == "Graduate")         fontFamilyClass = "graduate";
    else if (fontFamily  == "Gravitas One")     fontFamilyClass = "gravitas_one";
    else if (fontFamily  == "Old Standard TT")  fontFamilyClass = "old_standard_tt";

    this.$el
    .removeClass("droid")
    .removeClass("vollkorn")
    .removeClass("roboto")
    .removeClass("open_sans")
    .removeClass("lato")
    .removeClass("graduate")
    .removeClass("gravitas_one")
    .removeClass("old_standard_tt");

    this.$el.addClass(fontFamilyClass);

    if (textAlign === "right") {
      this.$el.addClass("align-right");
      this.$el.find(".stick").css({ left: "auto", right: -lineWidth });
    } else {
      this.$el.removeClass("align-right");
    }

    this._place();
    this._applyZoomLevelStyle();

  },

  _getRGBA: function(color, opacity) {
    return 'rgba(' + parseInt(color.slice(-6,-4),16)
    + ',' + parseInt(color.slice(-4,-2),16)
    + ',' + parseInt(color.slice(-2),16)
    + ',' + opacity + ' )';
  },

  _applyZoomLevelStyle: function() {

    var boxColor   = this.style.get("boxColor");
    var boxOpacity = this.style.get("boxOpacity");
    var lineColor  = this.style.get("lineColor");

    var minZoom    = this.model.get("minZoom");
    var maxZoom    = this.model.get("maxZoom");

    var currentZoom = this.mapView.map.get("zoom");

    if (currentZoom >= minZoom && currentZoom <= maxZoom) {

      var rgbaLineCol = this._getRGBA(lineColor, 1);
      var rgbaBoxCol  = this._getRGBA(boxColor, boxOpacity);

      this.$el.find(".text").animate({ opacity: 1 }, 150);

      this.$el.css("background-color", rgbaBoxCol);

      this.$el.find(".stick").css("background-color", rgbaLineCol);
      this.$el.find(".ball").css("background-color", rgbaLineCol);

      this.model.set("hidden", false);
      this.model.set("display", true);

    } else {
      this.model.set("hidden", true);
      this.model.set("display", false);
    }
  },

  clean: function() {
    this._unbindMap();
    cdb.core.View.prototype.clean.call(this);
  },

  _fixLinks: function() {

    this.$el.find("a").each(function(i, link) {
      $(this).attr("target", "_top");
    });

  },

  render: function() {
    var d = _.clone(this.model.attributes);
    d.text = this._sanitizedText();
    this.$el.html(this.template(d));

    this._fixLinks();

    var self = this;
    setTimeout(function() {
      self._applyStyle();
      self._applyZoomLevelStyle();
      self.show();
    }, 500);

    return this;

  }

});
