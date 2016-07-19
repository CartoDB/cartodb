var _ = require('underscore');
var StylesFactory = require('../../styles-factory');
var StyleFormDefaultModel = require('../style-form-default-model');

module.exports = StyleFormDefaultModel.extend({

  parse: function (r) {
    var geom = r.geom;
    var attrs = {
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

    if (r.type === 'heatmap') {
      attrs = _.omit(attrs, 'stroke', 'blending');
    } else {
      attrs = _.omit(attrs, 'resolution');
    }

    return attrs;
  },

  _onChange: function () {
    this._styleModel.set(_.clone(this.attributes));
  }

});
