var _ = require('underscore');
var StylesFactory = require('../../styles-factory');
var StyleFormDefaultModel = require('../style-form-default-model');

var TYPES = {
  HEATMAP: 'heatmap',
  ANIMATED: 'animated'
};

module.exports = StyleFormDefaultModel.extend({

  parse: function (r) {
    var geom = r.geom;
    var attrs = {
      style: r.style,
      fill: r.fill,
      stroke: r.stroke,
      blending: r.blending,
      resolution: r.resolution
    };
    var isAggregatedType = _.contains(StylesFactory.getAggregationTypes(), r.type);

    if (isAggregatedType || (geom && geom.getSimpleType() === 'polygon')) {
      delete attrs.fill.size;
    }

    if (geom && geom.getSimpleType() === 'line') {
      delete attrs.fill;
    }

    if (r.type === TYPES.HEATMAP) {
      attrs = _.omit(attrs, 'stroke', 'blending');
    } else {
      attrs = _.omit(attrs, 'resolution');
    }

    if (r.type !== TYPES.ANIMATED) {
      attrs = _.omit(attrs, 'style');
    }

    if (r.type === TYPES.ANIMATED) {
      if (r.style === 'heatmap') {
        attrs = _.omit(attrs, 'blending');
      }
    }

    return attrs;
  },

  _onChange: function () {
    this._styleModel.set(_.clone(this.attributes));
  }

});
