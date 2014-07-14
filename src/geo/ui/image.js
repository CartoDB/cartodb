cdb.geo.ui.Image = cdb.geo.ui.Text.extend({

  className: "cartodb-overlay image-overlay",

  events: { },

  default_options: { },

  initialize: function() {

    _.defaults(this.options, this.default_options);

    this.template = this.options.template;

  },

  _applyStyle: function() {

    var style      = this.model.get("style");

    var boxColor   = style["box-color"];
    var boxOpacity = style["box-opacity"];
    var boxWidth   = style["box-width"];

    this.$text.css(style);

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

    this._place();

    this.$el.html(this.template(_.extend(this.model.attributes, { text: this.model.attributes.extra.rendered_text })));

    this.$text = this.$el.find(".text");

    this._applyStyle();

    return this;

  }

});
