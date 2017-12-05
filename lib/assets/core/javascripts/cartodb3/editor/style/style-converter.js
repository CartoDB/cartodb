var _ = require('underscore');
var camshaftReference = require('../../data/camshaft-reference');
var StyleUtils = require('./style-generation/style-generation-utils');
var StyleConversion = require('./style-generation/style-generation-conversion');
var StyleAggregation = require('./style-generation/style-generation-aggregation');
var StyleGenerationSQL = require('./style-generation/style-generation-sql');
var StyleGenerationFactory = require('./style-generation/style-generation-factory');
var LAYER_TYPE = 'CartoDB';

var CONFIG = {
  GENERIC_STYLE: camshaftReference.getDefaultCartoCSSForType(),
  DEFAULT_HEATMAP_COLORS: ['blue', 'cyan', 'lightgreen', 'yellow', 'orange', 'red']
};

function renderBlock (block, geometryType, styleType, styleDef) {
  var css = {};
  for (var k in block) {
    var f = StyleGenerationFactory[k];
    if (f) {
      css = _.extend(css, f[geometryType](block[k], styleType, styleDef));
    }
  }
  return StyleUtils.convertObjToCartoCSS(css, '  ');
}

function generateCartoCSS (style, geometryType, configModel) {
  var css = '';
  var styleDef = style.properties;
  var styleType = style.type;
  var isAnimatable = StyleUtils.isTypeTorque(style.type);
  var isCategory = StyleUtils.isCategoryType(styleDef, geometryType);
  var hasStroke = !!styleDef.stroke;

  // Animated map 'controls'
  if (geometryType === 'point' && isAnimatable) {
    css += 'Map {\n';
    css += renderBlock({
      animated: _.extend({}, styleDef.animated, { isCategory: isCategory })
    }, geometryType);
    css += '}\n';
  }

  // Main styles
  var omittedStyleAttrs = ['animated', 'labels'];
  if (geometryType === 'polygon' || StyleUtils.canApplyDotProperties(styleType, styleDef)) {
    omittedStyleAttrs.push('stroke');
  }

  // Stroke for dot property
  if (hasStroke && geometryType === 'point' && StyleUtils.canApplyDotProperties(styleType, styleDef)) {
    css += '\n#layer::outline {\n';
    css += renderBlock({ stroke: styleDef.stroke }, geometryType, null, styleDef);
    css += '}\n';
  }

  css += '#layer {\n';
  css += renderBlock(_.omit(styleDef, omittedStyleAttrs), geometryType, styleType, styleDef);
  css += '}';

  // Outline (stroke for polygons) #12412
  if (hasStroke && geometryType === 'polygon') {
    css += '\n#layer::outline {\n';
    css += renderBlock({ stroke: styleDef.stroke }, geometryType);
    css += '}';
  }

  // Labels
  if (StyleUtils.isLabelsEnabled(styleDef)) {
    css += '\n#layer::labels {\n';
    css += renderBlock({ labels: styleDef.labels }, geometryType);
    css += '}';
  }

  // Animated Map trails
  if (isAnimatable && styleDef.animated.trails && styleDef.animated.trails > 0) {
    css += StyleGenerationFactory['trails'][geometryType](styleDef);
  }

  return css;
}

function generateSQL (style, geometryType, mapContext) {
  if (!StyleGenerationSQL.hasSQLByStyleType(style.type)) {
    return null;
  }

  if (style.type !== 'animation' && style.properties.aggregation === undefined) {
    throw new Error('aggregation properties not available');
  }

  return StyleGenerationSQL.getSQLByStyleType(style.type, style, mapContext);
}

/**
 * given a styleDefinition object and the geometry type generates the query wrapper and the
 */
function generateStyle (style, geometryType, mapContext, configModel) {
  var styleType = style.type;
  var styleDef = style.properties;

  if (styleType === 'none') {
    return {
      cartoCSS: CONFIG.GENERIC_STYLE,
      sql: null,
      layerType: LAYER_TYPE
    };
  }

  if (styleType !== 'simple' && geometryType !== 'point') {
    throw new Error('aggregated styling does not work with ' + geometryType);
  }

  // pre style conversion
  var needsConversion = StyleConversion.needsConversion(styleType);
  if (needsConversion) {
    style.properties = StyleConversion.getConversion(styleType, styleDef, configModel);
  }

  // override geometryType for aggregated styles
  if (StyleAggregation.needsOverwrite(styleType, geometryType)) {
    geometryType = StyleAggregation.getGeometryByStyleType(styleType, geometryType);
  }

  if (!geometryType) {
    throw new Error('geometry type not supported for ' + styleType);
  }

  var layerType = StyleUtils.isTypeTorque(styleType) ? 'torque' : 'CartoDB';

  return {
    cartoCSS: generateCartoCSS(style, geometryType, configModel),
    sql: generateSQL(style, geometryType, mapContext),
    layerType: layerType
  };
}

module.exports = {
  configure: function (cfg) {
    _.extend(CONFIG, cfg);
  },
  generateStyle: generateStyle,
  GENERIC_STYLE: CONFIG.GENERIC_STYLE
};
