var _ = require('underscore');
var StyleDefaults = require('./style-defaults');

module.exports = _.defaults({

  DEFAULT_FILL_COLOR: '#9DE0AD',
  DEFAULT_STROKE_COLOR: '#FFFFFF',
  DEFAULT_LABEL_COLOR: '#6F808D',
  DEFAULT_FILL_OPACITY: 0.7,

  generateAttributes: function (geometryType) {
    return _.extend(
      this._getFillAttrs(geometryType),
      this._getStrokeAttrs(geometryType),
      {
        blending: 'none'
      },
      this._getAggrAttrs(geometryType),
      this._getAnimatedAttrs(geometryType),
      this._getLabelsAttrs()
    );
  },

  _getFillAttrs: function (geometryType) {
    return {
      fill: {
        'size': {
          fixed: 10
        },
        // 'image': null,
        'color': {
          fixed: this.DEFAULT_FILL_COLOR,
          opacity: this.DEFAULT_FILL_OPACITY
        }
      }
    };
  },

  _getStrokeAttrs: function (geometryType) {
    if (geometryType !== 'line') {
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
    } else {
      return {};
    }
  },

  _getAnimatedAttrs: function (geometryType) {
    var attrs = {};

    if (geometryType === 'point') {
      attrs = {
        animated: {
          enabled: false,
          attribute: null,
          overlap: false,
          duration: 30,
          steps: 256,
          resolution: 2,
          trails: 2
        }
      };
    }
    return attrs;
  },

  _getAggrAttrs: function () {
    return {
      aggregation: {}
    };
  },

  _getLabelsAttrs: function () {
    return {
      labels: {
        enabled: false,
        attribute: null,
        font: 'DejaVu Sans Book',
        fill: {
          'size': {
            fixed: 10
          },
          'color': {
            fixed: this.DEFAULT_LABEL_COLOR,
            opacity: 1
          }
        },
        halo: {
          'size': {
            fixed: 1
          },
          'color': {
            fixed: this.DEFAULT_STROKE_COLOR,
            opacity: 1
          }
        },
        offset: -10,
        overlap: true,
        placement: 'point'
      }
    };
  }
}, StyleDefaults);
