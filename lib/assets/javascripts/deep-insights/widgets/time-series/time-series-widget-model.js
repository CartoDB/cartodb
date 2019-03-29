var WidgetModel = require('../widget-model');
var _ = require('underscore');

/**
 * Model for a time-series widget
 */
module.exports = WidgetModel.extend({
  defaults: {
    normalized: true,
    animated: false
  },

  defaultState: _.extend(
    {
      normalized: false
    },
    WidgetModel.prototype.defaultState
  ),

  getState: function () {
    var state = WidgetModel.prototype.getState.call(this);
    var start = this.dataviewModel.get('start');
    var end = this.dataviewModel.get('end');
    var data = this.dataviewModel.get('data');
    var lo = this.get('lo_index');
    var hi = this.get('hi_index');
    var l;
    var m;

    var checkRoughEqual = function (a, b) {
      if (_.isNumber(a) && _.isNumber(b) && (a !== b) && Math.abs(a - b) > Math.abs(start - end) * 0.01) {
        return true;
      }
      return false;
    };

    if (_.isNumber(lo) && _.isNumber(hi) && lo < data.length && (hi - 1) < data.length) {
      l = data[lo].start;
      m = data[hi - 1].end;
    } else {
      l = start;
      m = end;
    }

    if (checkRoughEqual(start, l)) {
      state.min = l;
    }
    if (checkRoughEqual(end, m)) {
      state.max = m;
    }

    return state;
  }
});
