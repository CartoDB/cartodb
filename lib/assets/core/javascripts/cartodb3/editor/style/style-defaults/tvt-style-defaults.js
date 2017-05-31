var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');
var DefaultFormValues = require('../../../data/default-form-styles.json');

module.exports = _.defaults({
  generateAttributes: function (geometryType) {
    return _.extend(
      {},
      this._getFillAttrs(),
      this._getStrokeAttrs(),
      {
        blending: DefaultFormValues['blending']
      },
      this._getAggrAttrs(geometryType)
    );
  },

  _getStrokeAttrs: function () {
    return {
      stroke: {}
    };
  },

  _getFillAttrs: function () {
    var attrs = {
      fill: {
        'size': {
          fixed: 7
        },
        'color': {
          fixed: '#FFB927',
          opacity: 0.9
        }
      }
    };

    return attrs;
  }
}, SimpleStyleDefaults);
