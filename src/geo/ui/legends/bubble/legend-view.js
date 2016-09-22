var _ = require('underscore');
var $ = require('jquery');
var DynamicLegendViewBase = require('../base/dynamic-legend-view-base');
var template = require('./legend-template.tpl');

var BubbleLegendView = DynamicLegendViewBase.extend({

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
      labels: this.model.get('values').slice(0).reverse(),
      bubbleSizes: this._calculateBubbleSizes(),
      avgSize: this._calculateAverageSize(),
      avgLabel: this.model.get('avg'),
      fillColor: this.model.get('fillColor')
    });
  },

  _calculateBubbleSizes: function () {
    var sizes = this.model.get('sizes').slice(0).reverse();
    var maxSize = sizes[0];
    return _.map(sizes, function (size, index) {
      if (index === 0) {
        return '100';
      }

      return size * 100 / maxSize;
    });
  },

  _calculateAverageSize: function () {
    var values = this.model.get('values').slice(0).reverse();
    var maxValue = values[0];
    return this.model.get('avg') * 100 / maxValue;
  }
});

module.exports = BubbleLegendView;
