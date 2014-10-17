cdb.geo.ui.Annotation = cdb.core.View.extend({

  className: "cartodb-overlay overlay-annotation",

  defaults: {
    style: {
      lineColor: "#333333",
      color: "#ffffff",
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

    this._cleanStyleProperties(this.options.style);
    _.defaults(this.options.style, this.defaults.style);

    this.model = new cdb.core.Model(this.options);

    this._setupModel();

    this.mapView.map.bind('change',      this._place, this);
    this.mapView.map.bind('change:zoom', this._applyZoomLevelStyle, this);

    // zoom level config
    var minZoomLevel     = this.mapView.map.get("minZoom");
    var maxZoomLevel     = this.mapView.map.get("maxZoom");

  },

  _setupModel: function() {
  
    this.model.on("change:text", this._onChangeText, this);
  
  },

  _onChangeText: function(e) {
    this.$el.find(".text").html(this.model.get("text"));
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

  show: function(callback) {
    var self = this;
    this.$el.fadeIn(150, function() {
      self.$el.css({ width: self.$el.width() + 1, display: "inline-table" }); // tricks
      callback && callback();
    });
  },

  hide: function(callback) {
    this.$el.fadeOut(150, function() {
      callback && callback();
    });
  },

  _place: function () {

    var latlng     = this.model.get("latlng");

    var style      = this.model.get("style");
    var lineWidth  = style["lineWidth"];
    var textAlign  = style["textAlign"];

    var pos        = this.mapView.latLonToPixel(latlng);
    var size       = this.mapView.getSize();
    var top        = pos.y - this.$el.height()/2;
    var left       = pos.x + lineWidth;

    if (textAlign === "right") {
      left = pos.x - this.$el.width() - lineWidth;
    }

    this.$el.css({ top: top, left: left });

  },

  _applyStyle: function(save) {

    var style      = this.model.get("style");

    var textAlign  = style["textAlign"];
    var boxColor   = style["boxColor"];
    var boxOpacity = style["boxOpacity"];
    var boxPadding = style["boxPadding"];
    var lineWidth  = style["lineWidth"];
    var lineColor  = style["lineColor"];
    var fontFamily = style["fontFamilyName"];

    this.$text = this.$el.find(".text");

    this.$text.css(style);

    this.$el.find(".content").css("padding", boxPadding);
    this.$text.css("font-size", style["fontSize"] + "px");
    this.$el.css("z-index", style["zIndex"]);

    this.$el.find(".stick").css({ width: lineWidth, left: -lineWidth });

    var fontFamilyClass = "";

    if      (fontFamily  == "Droid Sans") fontFamilyClass = "droid";
    else if (fontFamily  == "Vollkorn")   fontFamilyClass = "vollkorn";
    else if (fontFamily  == "Open Sans")  fontFamilyClass = "open_sans";
    else if (fontFamily  == "Roboto")     fontFamilyClass = "roboto";

    this.$el
    .removeClass("droid")
    .removeClass("vollkorn")
    .removeClass("roboto")
    .removeClass("open_sans");

    this.$el.addClass(fontFamilyClass);

    if (textAlign === "right") {
      this.$el.addClass("align-right");
      this.$el.find(".stick").css({ left: "auto", right: -lineWidth });
    } else {
      this.$el.removeClass("align-right");
    }

    this._place();

    this._applyZoomLevelStyle();

    if (save) this.model.save();

  },

  _applyZoomLevelStyle: function() {

    var style      = this.model.get("style");

    var boxColor   = style["boxColor"];
    var boxOpacity = style["boxOpacity"];
    var lineColor  = style["lineColor"];

    var minZoom    = style["zoomMin"];
    var maxZoom    = style["zoomMax"];

    var currentZoom = this.mapView.map.get("zoom");
    var textOpacity = 1;

    if (currentZoom >= minZoom && currentZoom <= maxZoom) {

      textOpacity = 1;

      var rgbaLineCol = 'rgba(' + parseInt(lineColor.slice(-6,-4),16)
      + ',' + parseInt(lineColor.slice(-4,-2),16)
      + ',' + parseInt(lineColor.slice(-2),16)
      + ',' + 1 + ' )';

      var rgbaBoxCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
      + ',' + parseInt(boxColor.slice(-4,-2),16)
      + ',' + parseInt(boxColor.slice(-2),16)
      + ',' + boxOpacity + ' )';

    } else {

      textOpacity = .5;

      var rgbaLineCol = 'rgba(' + parseInt(lineColor.slice(-6,-4),16)
      + ',' + parseInt(lineColor.slice(-4,-2),16)
      + ',' + parseInt(lineColor.slice(-2),16)
      + ',' + .2 + ' )';

      var rgbaBoxCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
      + ',' + parseInt(boxColor.slice(-4,-2),16)
      + ',' + parseInt(boxColor.slice(-2),16)
      + ',' + .2 + ' )';

    }

    this.$el.find(".text").animate({ opacity: textOpacity }, 150);

    this.$el.css("background-color", rgbaBoxCol);

    this.$el.find(".stick").css("background-color", rgbaLineCol);
    this.$el.find(".ball").css("background-color", rgbaLineCol);

  },

  render: function() {

    this.$el.html(this.template(this.model.attributes));

    var self = this;

    self._applyStyle();

    setTimeout(function() { self.show(); }, 500)

    return this;

  }

});
