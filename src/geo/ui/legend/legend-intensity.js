var IntensityLegend = require('./intensity-legend');
var LegendModel = require('../legend-model');

/**
 * Intensity Legend public interface
 */
var LegendIntensity = IntensityLegend.extend({

  className: "cartodb-legend intensity",
  type: "intensity",

  initialize: function() {

    this.items = this.options.items;

    this.model = new LegendModel({
      type: this.type,
      title: this.options.title,
      show_title: this.options.title ? true : false,
      color: this.options.color,
      leftLabel: this.options.left || this.options.leftLabel,
      rightLabel: this.options.right || this.options.rightLabel
    });

    this.add_related_model(this.model);
    this._bindModel();

  },

  _bindModel: function() {

    this.model.bind("change:title change:show_title change:color change:leftLabel change:rightLabel", this.render, this);

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    this._renderGraph(this.model.get("color"));

    return this;

  }

});

module.exports = LegendIntensity;
