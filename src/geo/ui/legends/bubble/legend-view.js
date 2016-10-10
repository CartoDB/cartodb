var _ = require('underscore');
var $ = require('jquery');
var LegendViewBase = require('../base/legend-view-base');
var template = require('./legend-template.tpl');
var formatter = require('../../../../util/formatter');

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
      labels: this._calculateLabels(),
      bubbleSizes: this._calculateBubbleSizes(),
      labelPositions: this._calculateLabelPositions(),
      avgSize: this._calculateAverageSize(),
      avgLabel: this.model.get('avg'),
      fillColor: this.model.get('fillColor'),
      formatter: formatter
    });
  },

  _calculateLabelPositions: function () {
    var labelPositions = this._calculateBubbleSizes();
    labelPositions.push(0);
    return labelPositions;
  },

  _calculateLabels: function () {
    var labels = this.model.get('values').slice(0).reverse();
    if (this._areSizesInAscendingOrder()) {
      labels = labels.reverse();
    }
    return labels;
  },

  _calculateValues: function () {
    var sizes = this.model.get('sizes').slice(0).reverse();
    if (this._areSizesInAscendingOrder()) {
      sizes = sizes.revers();
    }
  },

  _areSizesInAscendingOrder: function () {
    var sizes = this.model.get('sizes').slice(0);
    return _.first(sizes) < _.last(sizes);
  },

  _calculateBubbleSizes: function () {
    var sizes = this._calculateValues();
    var maxSize = sizes[0];
    return _.map(sizes, function (size, index) {
      if (index === 0) {
        return '100';
      }
      return size * 100 / maxSize;
    });
  },

  _calculateAverageSize: function () {
    var values = this._calculateValues();
    var maxValue = values[0];
    return this.model.get('avg') * 100 / maxValue;
  }
});

module.exports = BubbleLegendView;
