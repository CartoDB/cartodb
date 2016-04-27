var _ = require('underscore');

module.exports = {

  DEFAULT_FILL_COLOR: '#9DE0AD',
  DEFAULT_STROKE_COLOR: '#FFFFFF',
  DEFAULT_LABEL_COLOR: '#6F808D',
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

    if (geometryType !== 'polygon') {
      attrs['fill']['size'] = {
        fixed: geometryType === 'point' ? 10 : 2
      };
    }

    return attrs;
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

  _getAggrAttrs: function (geometryType) {
    return {};
  },

  _getAnimatedAttrs: function (geometryType) {
    var attrs = {};

    if (geometryType === 'point') {
      attrs = {
        torque: {
          enabled: false,
          column: null,
          overlap: 'linear',
          duration: 30,
          steps: 256,
          resolution: 2,
          trails: 2
        }
      };
    }
    return attrs;
  },

  _getLabelsAttrs: function () {
    return {
      labels: {
        enabled: false,
        column: null,
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
};
