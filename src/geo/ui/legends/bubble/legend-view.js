var _ = require('underscore');
var LegendViewBase = require('../base/legend-view-base');
var template = require('./legend-template.tpl');
var formatter = require('../../../../util/formatter');

var BubbleLegendView = LegendViewBase.extend({

  _getCompiledTemplate: function () {
    return template({
      hasCustomLabels: this._hasCustomLabels(),
      labels: this._calculateLabels(),
      bubbleSizes: this._calculateBubbleSizes(),
      labelPositions: this._calculateLabelPositions(),
      avgSize: this._calculateAverageSize(),
      avgLabel: this.model.get('avg'),
      fillColor: this.model.get('fillColor'),
      formatter: formatter
    });
  },

  _hasCustomLabels: function () {
    var topLabel = this.model.get('topLabel');
    var bottomLabel = this.model.get('bottomLabel');
    return ((topLabel != null && topLabel !== '') || (bottomLabel != null && bottomLabel !== ''));
  },

  _calculateLabelPositions: function () {
    var labelPositions;
    if (this._hasCustomLabels()) {
      labelPositions = [0, 100];
    } else {
      labelPositions = this._calculateBubbleSizes();
      labelPositions.push(0);
    }
    return labelPositions;
  },

  _calculateLabels: function () {
    var labels;

    if (this._hasCustomLabels()) {
      labels = [];
      labels.push(this.model.get('bottomLabel'));
      labels.push(this.model.get('topLabel'));
      labels = labels.reverse();
    } else {
      labels = this.model.get('values').slice(0);
      if (this._areSizesInAscendingOrder()) {
        labels = labels.reverse();
      }
    }
    return labels;
  },

  _calculateValues: function () {
    var sizes = this.model.get('sizes').slice(0);
    if (this._areSizesInAscendingOrder()) {
      sizes = sizes.reverse();
    }
    return sizes;
  },

  _areSizesInAscendingOrder: function () {
    var sizes = this.model.get('sizes').slice(0);
    return _.first(sizes) < _.last(sizes);
  },

  _calculateBubbleSizes: function () {
    var sizes = this._calculateValues();
    var maxSize = _.max(sizes);
    return _.map(sizes, function (size, index) {
      return size * 100 / maxSize;
    });
  },

  _calculateAverageSize: function () {
    // we build the size range, and reverse it to be able to normalize it with values.
    var sizes = this._calculateBubbleSizes().reverse();

    // we put 0 as the initial of the range
    sizes.unshift(0);

    // we need values and sizes because avg is a value and we need to place it taking sizes as reference.
    var values = this.model.get('values').slice(0);
    var avg = this.model.get('avg');

    // we need to position it in the right range
    // this reduce thing search the index of the range (index base) that avg belongs to
    // while avg is greater than the current value, memo is the next index, if not, memo doesn't change anymore
    // index + 1 because we pushed 0 to sizes and we need both arrays to have the same length
    var index = _.reduce(values, function (memo, value, index) {
      return value > avg ? memo : index + 1;
    }, 0);

    // avg it's at least equal to the last item
    if (index === values.length) {
      return 100;
    }

    // with the index calculate above, we get the % of the sizes we have to place the avg
    var minValue = sizes[index - 1];
    var maxValue = sizes[index];

    // Inside the range, we position it lineal
    var offset = (avg - values[index - 1]) / (values[index] - values[index - 1]);
    return minValue + (maxValue - minValue) * offset;
  }
});

module.exports = BubbleLegendView;
