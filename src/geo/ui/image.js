cdb.geo.ui.Image = cdb.geo.ui.Text.extend({

  className: "cartodb-overlay image-overlay",

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
    this.$el.css("z-index", style["z-index"]);

    var rgbaCol = 'rgba(' + parseInt(boxColor.slice(-6,-4),16)
    + ',' + parseInt(boxColor.slice(-4,-2),16)
    + ',' + parseInt(boxColor.slice(-2),16)
    +', ' + boxOpacity + ' )';

    this.$el.css({
      backgroundColor: rgbaCol
    });

    this.$el.find("img").css({ width: boxWidth });

  },

  render: function() {

    var content = this.model.get("extra").rendered_text;

    if (this.model.get("extra").has_default_image) content = '<img src="' + this.model.get("extra").public_default_image_url + '" />';

    this.$el.html(this.template(_.extend(this.model.attributes, { content: content })));

    this.$text = this.$el.find(".text");

    var self = this;

    setTimeout(function() {
      self._applyStyle();
      self._place();
      self.show();
    }, 900);


    return this;

  }

});
