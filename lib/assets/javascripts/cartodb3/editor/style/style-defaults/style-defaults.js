var _ = require('underscore');

module.exports = {

  DEFAULT_FILL_COLOR: '#FABADA',
  DEFAULT_STROKE_COLOR: '#FFFFFF',
  DEFAULT_LABEL_COLOR: '#AAAAAA',
  DEFAULT_FILL_OPACITY: 0.7,

  generateAttributes: function (geometryType) {
    return _.extend(
      this._getFillAttrs(geometryType),
      this._getStrokeAttrs(geometryType),
      this._getAggrAttrs(geometryType),
      this._getAnimatedAttrs(geometryType),
      this._getLabelsAttrs()
    );
  },

  _getFillAttrs: function (geometryType) {
    var attrs = {
      fill: {
        'color': {
          fixed: this.DEFAULT_FILL_COLOR,
          opacity: this.DEFAULT_FILL_OPACITY
        },
        'image': null
      }
    };

    return attrs;
  },

  _getStrokeAttrs: function () {
    return {
      stroke: {
        'size': {
          fixed: 2
        },
        'color': {
          fixed: this.DEFAULT_STROKE_COLOR,
          opacity: 1
        }
      }
    };
  },

  _getAggrAttrs: function () {
    return {};
  },

  _getAnimatedAttrs: function () {
    return {};
  },

  _getLabelsAttrs: function () {
    return {};
  }
};
