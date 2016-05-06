
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

function _labels(props) {
  var css = {};
  if (props.column && props.column !== '') {
    css['text-name'] = "[" + props.column + "]";
    css['text-face-name'] = "'" +  props.font + "'";
    if (props.fill) {
      css['text-size'] = props.fill.size.fixed;
      css['text-fill'] = props.fill.color.fixed;
    }
    css['text-label-position-tolerance'] = 0;
    if(props.halo) {
      css['text-halo-radius'] = props.halo.size.fixed;
      css['text-halo-fill'] = props.halo.color.fixed;
    }
    css['text-dy'] = props.offset === undefined ? -10: props.offset;
    css['text-allow-overlap'] = props.overlap ? true: false;
    css['text-placement'] = 'point';
    css['text-placement-type'] = 'dummy';
  }
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
  },

  labels: {
    point: _labels,
    line: _labels,
    polygon: _labels,
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

function generateCartoCSS(style, geometryType) {
  var styleDef = style.properties;
  var css = '';
  if (geometryType === 'point' && styleDef.animated && styleDef.animated.enabled && styleDef.animated.enabled !== 'false') {
    css += 'Map {\n';
    css += renderBlock({ animated: styleDef.animated }, geometryType);
    css += "}";
  }

  css += '#layer {\n';
  css += renderBlock(_.omit(styleDef, 'animated', 'labels'), geometryType);
  css += "}";

  // labels
  if (styleDef.labels && styleDef.labels.enabled && styleDef.labels.enabled !== 'false') {
    css += '\n#layer::labels {\n';
    css += renderBlock({ labels: styleDef.labels }, geometryType);
    css += "}";
  }
  return css;
}

function sizeToMeters(agg_size) {
  var m = {
    meters: 1,
    miles: 1.6,
    kilometers: 2
  }
  return agg_size.size.fixed * m[agg_size.distance_unit.fixed];
}

function hexabins(styleDef) {
  var sql = "WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(!bbox!, greatest(!pixel_width!,!pixel_height!) * <%= size %>), greatest(!pixel_width!,!pixel_height!) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, count(1) as points_count, count(1)/power( <%= size %> * CDB_XYZ_Resolution(<%= z %>), 2 ) as points_density, 1 as cartodb_id FROM hgrid, <%= table %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell";
  return _.template(sql)({
    table: '<%= sql %>',
    size: sizeToMeters(styleDef.aggregation.aggr_size),
    z: 'CDB_ZoomFromScale(!scale_denominator!)'
  });
}

var SQLFactory = {
  hexabins: hexabins
}

function generateSQL(style, geometryType) {
  if (style.type === 'simple') {
    return null;
  }
  var fn = SQLFactory[style.type];
  if (fn === undefined) {
    throw new Error("can't generate SQL for aggregation " + style.type);
  }
  return fn(style);
}


AggregatedFactory = {
  simple: {
    geometryType: {
      point: 'point',
      line: 'line',
      polygon: 'polygon'
    }
  },
  hexabins: {
    geometryType: {
      point: 'polygon',
      line: null,
      polygon: null 
    }
  }
}

/**
 * given a styleDefinition object and the geometry type generates the query wrapper and the
 */
function generateStyle(style, geometryType) {

  if (style.type !== 'simple' && geometryType !== 'point') {
    throw new Error("aggregated styling does not work with " + geometryType);
  }

  // override geometryType for aggregated styles
  geometryType = AggregatedFactory[style.type].geometryType[geometryType];

  if (!geometryType) {
    throw new Error("geometry type not supported for " + style.type)
  }

  return {
    cartoCSS: generateCartoCSS(style, geometryType),
    sql: generateSQL(style, geometryType)
  }
}


module.exports = {
  generateStyle: generateStyle
}
