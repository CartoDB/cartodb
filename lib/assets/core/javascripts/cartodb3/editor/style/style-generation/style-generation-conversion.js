var _ = require('underscore');
var DEFAULT_HEATMAP_COLORS = ['blue', 'cyan', 'lightgreen', 'yellow', 'orange', 'red'];
var DEFAULT_ALPHAMARKER_PATH = '/unversioned/images/alphamarker.png';

/**
 *  Some styles need some conversion, for example aggregated based on
 *  Torque need to move from aggregation to animated properties.
 *
 */

var heatmapConversion = function (style, animated, configModel) {
  // modify the size
  style.fill = _.clone(style.fill);
  var ramp = style.fill.color.range;
  style.fill.size = style.fill.size || { fixed: 35 };

  style.fill.image = 'url(' + configModel.get('app_assets_base_url') + DEFAULT_ALPHAMARKER_PATH + ')';

  style.fill.color = {
    fixed: style.fill.color.fixed || 'white',
    opacity: style.fill.color.opacity
  };

  // add image filters
  if (ramp !== undefined) {
    style.imageFilters = {
      ramp: _.isArray(ramp) ? ramp : DEFAULT_HEATMAP_COLORS
    };
  }
  return style;
};

var styleConversion = {
  animation: function (styleProperties, configModel) {
    if (styleProperties.style === 'heatmap') {
      return heatmapConversion(styleProperties, true, configModel);
    }
    return styleProperties;
  },

  heatmap: function (styleProperties, configModel) {
    return heatmapConversion(styleProperties, false, configModel);
  }
};

module.exports = {
  needsConversion: function (styleType) {
    return !!styleConversion[styleType];
  },

  getConversion: function (styleType, styleProperties, configModel) {
    if (!this.needsConversion(styleType)) {
      return styleProperties;
    }
    return styleConversion[styleType](styleProperties, configModel);
  }
};
