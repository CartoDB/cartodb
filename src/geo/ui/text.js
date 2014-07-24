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

    this.$text.css(style);
    this.$text.css("font-size", style["font-size"] + "px");

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el.css({
      backgroundColor: rgbaCol,
      maxWidth:        boxWidth
    });

  },

  _place: function() {

    var pTop  = this.model.get("extra").pTop
    var pLeft = this.model.get("extra").pLeft;

    var top   = this.model.get("y");
    var left  = this.model.get("x");

    var right  = "auto";
    var bottom = "auto";

    if (this.model.get("extra").landscapeDominantSide == 'right') {
      left = "auto";
      right = this.model.get("extra").r;
    }

    if (this.model.get("extra").portraitDominantSide == 'bottom') {
      top = "auto";
      bottom = this.model.get("extra").b;
    }

    //console.log("top: " + top, "left: " + left, "right: " + right, "bottom: " + bottom);

    var width = this.model.get("extra").width;

    this.$el.css({
      width: width,
      top: top,
      left: left,
      right: right - this.$el.width(),
      bottom: bottom - this.$el.height()
    });

  },


  render: function() {

    this._place();

    this.$el.html(this.template(_.extend(this.model.attributes, { text: this.model.attributes.extra.rendered_text })));

    this.$text = this.$el.find(".text");

    this._applyStyle();

    return this;

  }

});
