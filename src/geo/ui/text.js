cdb.geo.ui.Text = cdb.core.View.extend({

  className: "cartodb-overlay overlay-text",

  events: {
  },

  default_options: {
  },

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

    var landscapeDirection = this.model.get("extra").landscapeDirection;
    var portraitDirection  = this.model.get("extra").portraitDirection;

    if (portraitDirection == 'bottom') {

      this.$el.css({
        top: this.model.get("y")
      });

      this.$el.css({
        top: "auto",
        bottom: this.model.get("y")
      });

    } else {
      this.$el.css({
        top: this.model.get("y")
      });
    }

    if (landscapeDirection == 'right') {

      this.$el.css({
        left: this.model.get("x")
      });

      this.$el.css({
        left: "auto",
        right: this.model.get("x")
      });

    } else {
      this.$el.css({
        left: this.model.get("x")
      });
    }

  },


  render: function() {

    this._place();

    this.$el.html(this.template(_.extend(this.model.attributes, { text: this.model.attributes.extra.rendered_text })));

    this.$text = this.$el.find(".text");

    this._applyStyle();

    return this;

  }

});
