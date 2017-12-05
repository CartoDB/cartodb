var StyleLabelsGeneration = require('./style-labels-generation');
var StyleStrokeGeneration = require('./style-stroke-generation');
var StyleAnimationGeneration = require('./style-animation-generation');
var StyleTrailsGeneration = require('./style-trails-generation');
var StyleFiltersGeneration = require('./style-filters-generation');
var StyleBlendingGeneration = require('./style-blending-generation');
var StyleFillGeneration = require('./style-fill-generation');
var StyleUtils = require('./style-generation-utils');

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
    point: function (strokeObj, styleType, styleDef) {
      return StyleStrokeGeneration.getPointCSS(strokeObj, styleType, styleDef);
    },
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
    point: function (blendingValue, styleType, styleDef) {
      if (StyleUtils.canApplyDotProperties(styleType, styleDef)) {
        return StyleBlendingGeneration(blendingValue, 'dot', styleType);
      } else {
        return StyleBlendingGeneration(blendingValue, 'marker', styleType);
      }
    },
    line: function (blendingValue) {
      return StyleBlendingGeneration(blendingValue, 'line');
    },
    polygon: function (blendingValue) {
      return StyleBlendingGeneration(blendingValue, 'polygon');
    }
  }
};
