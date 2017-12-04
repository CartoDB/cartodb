var _ = require('underscore');
var StyleTurboCarto = require('./style-turbocarto-generation');
var StyleUtils = require('./style-generation-utils');

/**
 *  Function for generating the proper fill CartoCSS
 *  - by point (dot or marker)
 *  - by polygon
 */

function dotSize (sizeObj) {
  var css = {};
  if (sizeObj.fixed !== undefined) {
    css['dot-width'] = sizeObj.fixed;
  } else if (sizeObj.attribute) {
    css['dot-width'] = StyleTurboCarto.generateWidthRamp(sizeObj);
  } else {
    console.error('size should contain a fixed value or an attribute');
  }
  return css;
}

function dotFill (fillObj) {
  var css = {};
  var color = (fillObj && fillObj.color) || {};
  var size = (fillObj && fillObj.size) || {};
  var opacity = color && color.opacity;

  if (size) {
    css = dotSize(size);
  }
  if (color) {
    css['dot-fill'] = (color.fixed !== undefined) ? color.fixed : StyleTurboCarto.generateColorRamp(color);
  }

  css['dot-opacity'] = opacity != null ? opacity : 1;

  return css;
}

function markerSize (props) {
  var css = {};
  if (props.fixed !== undefined) {
    css['marker-width'] = props.fixed;
  } else if (props.attribute) {
    css['marker-width'] = StyleTurboCarto.generateWidthRamp(props);
  } else {
    console.error('size should contain a fixed value or an attribute');
  }
  return css;
}

function markerFill (props, animationType) {
  var css = {};
  var color = (props && props.color) || {};
  var isTorqueCategory = animationType && !color.fixed;
  var markerFillOpacity = color.opacity;

  if (props.size) {
    css = markerSize(props.size);
  }
  if (color) {
    if (color.fixed !== undefined) {
      css['marker-fill'] = color.fixed;
    } else if (color.attribute) {
      css['marker-fill'] = StyleTurboCarto.generateColorRamp(color, isTorqueCategory);
    }
    if (color.operation) {
      css['marker-comp-op'] = color.operation;
    }

    css['marker-fill-opacity'] = markerFillOpacity != null ? markerFillOpacity : 1;

    if (StyleUtils.hasImagesSelected(props.images) || StyleUtils.hasImagesSelected(color.images)) {
      css['marker-file'] = markerFile(props.images || color.images, color);
    } else if (props.image || color.image) {
      var url = props.image;

      if (color.image) {
        url = 'url(\'' + color.image + '\')';
      }

      css['marker-file'] = url;
    }
  }
  if (!animationType) {
    css['marker-allow-overlap'] = true;
  }
  return css;
}

function markerFile (images, color) {
  var getFalsyCategory = function (category) {
    return category === 0 ? '0' : "''";
  };

  if (!_.isArray(images) || !color || !color.attribute) {
    return;
  }

  var columnName = '[' + color.attribute + ']';
  var filesUrls = [];
  var categoryNames = [];

  _.each(images, function (image, index) {
    if (image !== '') {
      var urlFormat = 'url(\'' + image + '\')';
      filesUrls.push(urlFormat);
      if (!_.isUndefined(color.domain[index])) {
        var category = color.domain[index] || getFalsyCategory(color.domain[index]);
        categoryNames.push(category);
      }
    }
  });

  return 'ramp(' + columnName + ', (' + filesUrls.join(', ') + '), (' + categoryNames.join(', ') + '), "="' + ')';
}

function polygonFill (props) {
  var css = {};
  if (props.color) {
    if (props.color.fixed !== undefined) {
      css['polygon-fill'] = props.color.fixed;
    } else if (props.color.attribute) {
      css['polygon-fill'] = StyleTurboCarto.generateColorRamp(props.color);
    }
    if (props.color.operation) {
      css['polygon-comp-op'] = props.color.operation;
    }
    if (_.isNumber(props.color.opacity)) {
      css['polygon-opacity'] = props.color.opacity;
    }
  }

  return css;
}

module.exports = {
  getPointCSS: function (fillDef, animationType) {
    if (StyleUtils.canApplyDotProperties(fillDef)) {
      return dotFill(fillDef, animationType);
    } else {
      return markerFill(fillDef, animationType);
    }
  },
  getPolygonCSS: polygonFill
};
