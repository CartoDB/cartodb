var _ = require('underscore');
var StyleDefaults = require('./style-defaults');
var DefaultCartography = require('builder/data/default-cartography.json');
var DefaultFormValues = require('builder/data/default-form-styles.json');
var Utils = require('builder/helpers/utils');

module.exports = _.defaults({

  generateAttributes: function (geometryType) {
    return _.extend(
      {},
      this._getFillAttrs(geometryType),
      this._getStrokeAttrs(geometryType),
      {
        blending: DefaultFormValues['blending']
      },
      this._getAggrAttrs(geometryType),
      this._getLabelsAttrs()
    );
  },

  _getFillAttrs: function (geometryType) {
    var fillAttrs = DefaultCartography['simple'][geometryType]['fill'];
    return {
      fill: Utils.cloneObject(fillAttrs)
    };
  },

  _getStrokeAttrs: function (geometryType) {
    var strokeAttrs = DefaultCartography['simple'][geometryType]['stroke'];
    return {
      stroke: Utils.cloneObject(strokeAttrs)
    };
  },

  _getAggrAttrs: function () {
    var aggrAttrs = DefaultFormValues['aggregation'];
    return {
      aggregation: Utils.cloneObject(aggrAttrs)
    };
  },

  _getLabelsAttrs: function () {
    var labelsAttrs = DefaultFormValues['labels'];
    return {
      labels: Utils.cloneObject(labelsAttrs)
    };
  }
}, StyleDefaults);
