var _ = require('underscore');
var StyleTurboCarto = require('./style-turbocarto-generation');

/**
 *  Stroke CartoCSS by geometry type
 *  - by point
 *  - by polygon/line
 *
 */

function markerStroke (strokeObj, styleType, styleDef) {
  var css = {};
  var animationType = styleDef.style;

  if (animationType === 'heatmap') {
    return css;
  }

  if (strokeObj.size) {
    css['marker-line-width'] = strokeObj.size.fixed;
  }
  if (strokeObj.color) {
    if (strokeObj.color.fixed !== undefined) {
      css['marker-line-color'] = strokeObj.color.fixed;
    } else if (strokeObj.color.attribute) {
      css['marker-line-color'] = StyleTurboCarto.generateColorRamp(strokeObj.color);
    }
    if (_.isNumber(strokeObj.color.opacity)) {
      css['marker-line-opacity'] = strokeObj.color.opacity;
    }
  }
  return css;
}

function polygonStroke (strokeObj) {
  var css = {};
  if (strokeObj.size) {
    if (strokeObj.size.fixed !== undefined) {
      css['line-width'] = strokeObj.size.fixed;
    } else if (strokeObj.size.attribute) {
      css['line-width'] = StyleTurboCarto.generateWidthRamp(strokeObj.size);
    }
  }
  if (strokeObj.color) {
    if (strokeObj.color.fixed) {
      css['line-color'] = strokeObj.color.fixed;
    } else if (strokeObj.color.attribute) {
      css['line-color'] = StyleTurboCarto.generateColorRamp(strokeObj.color);
    }
    if (_.isNumber(strokeObj.color.opacity)) {
      css['line-opacity'] = strokeObj.color.opacity;
    }
  }
  return css;
}

module.exports = {
  getPointCSS: markerStroke,
  getLineCSS: polygonStroke,
  getPolygonCSS: polygonStroke
};
