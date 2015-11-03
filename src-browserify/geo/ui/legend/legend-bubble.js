var LegendModel = require('../legend-model');
var BubbleLegend = require('./bubble-legend');

/**
 * Bubble Legend public interface
 */
var LegendBubble = BubbleLegend.extend({

  className: "cartodb-legend bubble",

  type: "bubble",

  initialize: function() {

    this.model = new LegendModel({
      type:  this.type,
      title: this.options.title,
      min:   this.options.min,
      max:   this.options.max,
      color: this.options.color,
      show_title: this.options.title ? true : false
    });

    this.add_related_model(this.model);

    this._bindModel();

  },

  render: function() {

    this.$el.html(this.template(this.model.toJSON()));

    this._renderGraph(this.model.get("color"));

    return this;

  }

});

module.exports = LegendBubble;
