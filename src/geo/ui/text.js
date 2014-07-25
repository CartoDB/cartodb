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

    var top   = this.model.get("y");
    var left  = this.model.get("x");

    // position percentages
    var pTop  = this.model.get("extra").pTop
    var pLeft = this.model.get("extra").pLeft;

    var right  = "auto";
    var bottom = "auto";
    
    var marginTop  = 0;
    var marginLeft = 0;

    var width = this.model.get("extra").width;

    if (pTop > 40 && pTop < 55) {

      top = "50%";
      marginTop = -this.$el.height()/2;

    }  else {

      var portraitDominantSide  = this.model.get("extra").portraitDominantSide;

      if (portraitDominantSide == 'bottom') {
        top = "auto";
        bottom = this.model.get("extra").b - this.$el.height();
      }

    }

    if (pLeft > 40 && pLeft < 55) {

      left = "50%";
      marginLeft = -width/2;

    } else {

      var landscapeDominantSide = this.model.get("extra").landscapeDominantSide;

      if (landscapeDominantSide == 'right') {
        left = "auto";
        right = this.model.get("extra").r - this.$el.width();
      }

    }

    this.$el.css({
      width: width,
      marginLeft: marginLeft,
      marginTop: marginTop,
      top: top,
      left: left,
      right: right,
      bottom: bottom
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
