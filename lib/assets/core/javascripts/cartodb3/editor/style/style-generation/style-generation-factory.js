var StyleLabelsGeneration = require('./style-labels-generation');
var StyleStrokeGeneration = require('./style-stroke-generation');
var StyleAnimationGeneration = require('./style-animation-generation');
var StyleTrailsGeneration = require('./style-trails-generation');
var StyleFiltersGeneration = require('./style-filters-generation');
var StyleBlendingGeneration = require('./style-blending-generation');
var StyleFillGeneration = require('./style-fill-generation');

/**
 *  CartoCSS generation factory, by style type 💃🏻
 *
 */

var _null = function () {
  return '';
};

module.exports = {
  animated: {
    point: StyleAnimationGeneration,
    line: _null,
    polygon: _null
  },

  trails: {
    point: StyleTrailsGeneration,
    line: _null,
    polygon: _null
  },

  fill: {
    point: StyleFillGeneration.getPointCSS,
    line: _null,
    polygon: StyleFillGeneration.getPolygonCSS
  },

  stroke: {
    point: StyleStrokeGeneration.getPointCSS,
    line: StyleStrokeGeneration.getLineCSS,
    polygon: StyleStrokeGeneration.getPolygonCSS
  },

  labels: {
    point: StyleLabelsGeneration,
    line: StyleLabelsGeneration,
    polygon: StyleLabelsGeneration
  },

  imageFilters: {
    point: StyleFiltersGeneration,
    line: StyleFiltersGeneration,
    polygon: StyleFiltersGeneration
  },

  blending: {
    point: function (attrs, animationType) {
      return StyleBlendingGeneration(attrs, 'marker', animationType);
    },
    line: function (attrs) {
      return StyleBlendingGeneration(attrs, 'line');
    },
    polygon: function (attrs) {
      return StyleBlendingGeneration(attrs, 'polygon');
    }
  }
};
