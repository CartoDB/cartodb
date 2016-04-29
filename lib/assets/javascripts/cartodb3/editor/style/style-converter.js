
// utilities 
function _null() { return ''; }

function makeCartoCSS (obj) {
  var css = '';
  for (var k in obj) {
    css += k + ": " + obj[k] + ";\n"
  }
  return css;
}

// fill
function pointFill (props) {
  var css = {};
  if (props.color) {
    css['marker-fill'] = props.color.fixed;
    css['marker-fill-opacity'] = props.color.opacity;
  }
  return makeCartoCSS(css);
}

function polygonFill(props) {
  var css = {};
  if (props.color) {
    css['polygon-fill'] = props.color.fixed;
    css['polygon-opacity'] = props.color.opacity;
  }
  return makeCartoCSS(css);
}

// stroke
function pointStroke (props) {
  var css = {};
  if (props.size) {
    css['marker-line-width'] = props.size.fixed;
  }
  if (props.color) {
    css['marker-line-color'] = props.color.fixed;
    css['marker-line-opacity'] = props.color.opacity;
  }
  return makeCartoCSS(css);
}

function polygonStroke(props) {
  var css = {};
  if (props.size) {
    css['line-width'] = props.size.fixed;
  }
  if (props.color) {
    css['line-color'] = props.color.fixed;
    css['line-opacity'] = props.color.opacity;
  }
  return makeCartoCSS(css);
}

function pointAnimated(props) {
  var css = {};
  css['-torque-frame-count'] = props.steps;
  css['-torque-animation-duration'] = props.duration;
  css['-torque-time-attribute'] = '"' + props.column + '"';
  css['-torque-aggregation-function'] = '"count(1)"';
  css['-torque-resolution'] = props.resolution;
  css['-torque-data-aggregation'] = props.overlap;
  return makeCartoCSS(css);
}


var cartocssFactory = {
  animated: {
    point: pointAnimated,
    line: _null,
    polygon: _null
  },

  fill: {
    point: pointFill,
    line: _null,
    polygon: polygonFill
  },

  stroke: {
    point: pointStroke,
    line: polygonStroke,
    polygon: polygonStroke
  }
}

function renderBlock(block, geometryType) {
  var css = '';
  for (var k in block) {
    var f = cartocssFactory[k];
    if (f) {
      css += f[geometryType](block[k]);
    }
  }
  return css;
}
/**
 * given a styleDefinition object and the geometry type generates the query wrapper and the
 */

function generateStyle(style, geometryType) {

  var styleDef = style.properties;

  var css = '';
  if (geometryType === 'point' && styleDef.animated && styleDef.animated.enabled && styleDef.animated.enabled !== 'false') {
    css += 'Map {\n';
    css += renderBlock({ animated: styleDef.animated }, geometryType);
    css += "}";
  }

  css += '#layer {\n';
  css += renderBlock(_.omit(styleDef, 'animated'), geometryType);
  css += "}";
  return {
    cartoCSS: css,
    sql: null
  }
}


module.exports = {
  generateStyle: generateStyle
}
