var $ = require('jquery');
var LegendViewBase = require('./legend-view-base');
var template = require('./bubble-legend-template.tpl');

var BubbleLegendView = LegendViewBase.extend({

  events: {
    'mouseover .js-bubbleItem': '_onBubbleHover',
    'mouseout .js-bubbleItem': '_onBubbleOut'
  },

  _onBubbleHover: function (event) {
    var bubble = $(event.target);
    this.$('.js-bubbleItem').addClass('is-filter');
    bubble.removeClass('is-filter');
  },

  _onBubbleOut: function (event) {
    this.$('.js-bubbleItem').removeClass('is-filter');
  },

  _getCompiledTemplate: function () {
    return template({
      bubbles: this.model.get('bubbles'),
      avg: this.model.get('avg'),
      fillColor: this.model.get('fillColor')
    });
  }
});

module.exports = BubbleLegendView;
