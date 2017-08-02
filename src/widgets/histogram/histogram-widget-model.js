var _ = require('underscore');
var WidgetModel = require('../widget-model');

/**
 * Model for a histogram widget
 */
module.exports = WidgetModel.extend({
  defaults: {
    normalized: true
  },

  defaultState: _.extend(
    {
      autoStyle: false,
      normalized: false
    },
    WidgetModel.prototype.defaultState
  ),

  initialize: function (attrs, opts) {
    WidgetModel.prototype.initialize.apply(this, arguments);
    this.on('change:collapsed', this._onCollapsedChange, this);
    this.on('change:style', this._updateAutoStyle, this);
    this.dataviewModel.once('change', function () {
      if (this.get('autoStyle')) {
        this.autoStyle();
      }
    }, this);
  },

  _onCollapsedChange: function (m, isCollapsed) {
    this.dataviewModel.set('enabled', !isCollapsed);
  },

  getState: function () {
    var state = WidgetModel.prototype.getState.call(this);
    var start = this.dataviewModel.get('start');
    var end = this.dataviewModel.get('end');
    var min = this.get('min');
    var max = this.get('max');

    var checkRoughEqual = function (a, b) {
      if (_.isNumber(a) && _.isNumber(b) && (a !== b) && Math.abs(a - b) > Math.abs(start - end) * 0.01) {
        return true;
      }
      return false;
    };

    if (checkRoughEqual(start, min)) {
      state.min = min;
    } else {
      delete state.min;
    }

    if (checkRoughEqual(end, max)) {
      state.max = max;
    } else {
      delete state.max;
    }

    if (this.get('zoomed') === true) {
      state.zoomed = true;
    }

    return state;
  }

});
