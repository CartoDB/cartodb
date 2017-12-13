var _ = require('underscore');
var StyleTurboCarto = require('./style-turbocarto-generation');
var StyleUtils = require('./style-generation-utils');

/**
 *  Stroke CartoCSS by geometry type
 *  - by point (dot or marker)
 *  - by polygon/line
 *
 */

function dotStroke (strokeObj, styleType, fillDef) {
  var css = {};
  var color = strokeObj.color;
  var fillSize = fillDef.size || {};
  var strokeSize = strokeObj.size || {};

  if (color.fixed !== undefined) {
    css['dot-fill'] = color.fixed;
  } else if (color.attribute) {
    css['dot-fill'] = StyleTurboCarto.generateColorRamp(color);
  }

  if (fillSize.attribute !== undefined) {
    css['dot-width'] = StyleTurboCarto.generateWidthRamp(fillSize, strokeSize.fixed);
  } else {
    css['dot-width'] = (fillSize.fixed || 0) + (strokeSize.fixed || 0);
  }

  css['dot-opacity'] = color.opacity;

  return css;
}

function markerStroke (strokeObj, animationType) {
  var css = {};

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

function polygonStroke (strokeObj, styleType) {
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
  getPointCSS: function (strokeObj, styleType, styleDef) {
    return markerStroke(strokeObj, styleDef.style);
  },
  getLineCSS: polygonStroke,
  getPolygonCSS: polygonStroke
};
