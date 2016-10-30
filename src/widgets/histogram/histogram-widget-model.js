var WidgetModel = require('../widget-model');
var _ = require('underscore');

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

  _updateAutoStyle: function (e) {
    var styles = (e && e.changed && e.changed.style) || this.get('style');
    if (this.autoStyler) {
      this.autoStyler.updateColors(styles);
    }
    if (this.isAutoStyle()) {
      this.reapplyAutoStyle();
    }
  },

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

    if (_.isNumber(lo) && _.isNumber(hi)) {
      l = data[lo] && data[lo].start;
      m = data[hi - 1] && data[hi - 1].end;
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

    if (this.get('zoomed') === true) {
      state.zoomed = true;
    }

    return state;
  }

});
