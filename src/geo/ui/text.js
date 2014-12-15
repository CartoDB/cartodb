cdb.geo.ui.Text = cdb.core.View.extend({

  className: "cartodb-overlay overlay-text",

  events: {
    "click": "stopPropagation"
  },

  default_options: { },

  stopPropagation: function(e) {

    e.stopPropagation();

  },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    this.template = this.options.template;

    var self = this;

    $(window).on("map_resized", function() {
      self._place();
    });

    $(window).on("resize", function() {
      self._place();
    });

  },

  _applyStyle: function() {

    var style      = this.model.get("style");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxWidth   = style["box-width"];
    var fontFamily = style["font-family-name"];

    this.$text = this.$el.find(".text");

    this.$text.css(style);
    this.$text.css("font-size", style["font-size"] + "px");

    this.$el.css("z-index", style["z-index"]);

    var fontFamilyClass = "";

    if      (fontFamily  == "Droid Sans") fontFamilyClass = "droid";
    else if (fontFamily  == "Vollkorn")   fontFamilyClass = "vollkorn";
    else if (fontFamily  == "Open Sans")  fontFamilyClass = "open_sans";
    else if (fontFamily  == "Roboto")     fontFamilyClass = "roboto";

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el
    .removeClass("droid")
    .removeClass("vollkorn")
    .removeClass("roboto")
    .removeClass("open_sans");

    this.$el.addClass(fontFamilyClass);
    this.$el.css({
      backgroundColor: rgbaCol,
      maxWidth:        boxWidth
    });

  },

  _place: function(position) {

    var extra = position || this.model.get("extra");

    var top   = this.model.get("y");
    var left  = this.model.get("x");

    var bottom_position = extra.bottom - this.$el.height();
    var right_position  = extra.right  - this.$el.width();

    // position percentages
    var top_percentage  = extra.top_percentage;
    var left_percentage = extra.left_percentage;

    var right  = "auto";
    var bottom = "auto";

    var marginTop  = 0;
    var marginLeft = 0;

    var width  = extra.width;
    var height = extra.height;

    var portrait_dominant_side  = extra.portrait_dominant_side;
    var landscape_dominant_side = extra.landscape_dominant_side;

    if (portrait_dominant_side === 'bottom' && bottom_position <= 250) {

      top = "auto";
      bottom = bottom_position;

    } else if (top_percentage > 45 && top_percentage < 55) {

      top = "50%";
      marginTop = -height/2;

    }

    if (landscape_dominant_side === 'right' && right_position <= 250) {

      left = "auto";
      right = right_position;

    } else if (left_percentage > 45 && left_percentage < 55) {

      left = "50%";
      marginLeft = -width/2;

    }

    this.$el.css({
      marginLeft: marginLeft,
      marginTop: marginTop,
      top: top,
      left: left,
      right: right,
      bottom: bottom
    });

  },

  show: function(callback) {
    this.$el.fadeIn(150, function() {
      callback && callback();
    });
  },

  hide: function(callback) {
    this.$el.fadeOut(150, function() {
      callback && callback();
    });
  },

  _fixLinks: function() {

    this.$el.find("a").each(function(i, link) {
      $(this).attr("target", "_top");
    });

  },

  render: function() {

    var self = this;

    this.$el.html(this.template(_.extend(this.model.attributes, { text: this.model.attributes.extra.rendered_text })));

    this._fixLinks();

    setTimeout(function() {
      self._applyStyle();
      self._place();
      self.show();
    }, 900);

    return this;

  }

});
