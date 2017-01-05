var CategoryModel = require('./legend-category-definition-model');
var BubbleModel = require('./legend-bubble-definition-model');
var ChoroplethModel = require('./legend-choropleth-definition-model');
var CustomChoroplethModel = require('./legend-custom-choropleth-definition-model');
var CustomhModel = require('./legend-custom-definition-model');

var LEGENDS_METADATA = {
  bubble: {
    legendType: 'size',
    model: BubbleModel
  },
  category: {
    legendType: 'color',
    model: CategoryModel
  },
  choropleth: {
    legendType: 'color',
    model: ChoroplethModel
  },
  custom: {
    legendType: 'color',
    model: CustomhModel
  },
  custom_choropleth: {
    legendType: 'color',
    model: CustomChoroplethModel
  }
};

module.exports = LEGENDS_METADATA;
