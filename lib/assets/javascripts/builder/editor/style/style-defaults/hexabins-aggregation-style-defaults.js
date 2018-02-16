var _ = require('underscore');
var SimpleStyleDefaults = require('./simple-style-defaults');
var DefaultFormValues = require('builder/data/default-form-styles.json');
var Utils = require('builder/helpers/utils');
var rampList = require('cartocolor');

module.exports = _.defaults({

  _getAggrAttrs: function (geometryType) {
    return {
      aggregation: {
        size: 10,
        value: {
          operator: 'count',
          attribute: ''
        }
      }
    };
  },

  _getStrokeAttrs: function (geometryType) {
    var strokeAttrs = DefaultFormValues['stroke'];
    return {
      stroke: Utils.cloneObject(strokeAttrs)
    };
  },

  _getFillAttrs: function (geometryType) {
    var colors = rampList['ag_GrnYl'][5];
    return {
      fill: {
        'color': {
          attribute: 'agg_value',
          bins: '5',
          quantification: 'quantiles',
          // TODO: flip the ramp when basemap is black
          // range: rampList.ag_GrnYl[5].reverse()
          range: Utils.cloneObject(colors)
        }
      }
    };
  }

}, SimpleStyleDefaults);
