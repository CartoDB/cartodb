var _ = require('underscore');

// utilities
function _null () { return ''; }

function makeCartoCSS (obj) {
  var css = '';
  for (var k in obj) {
    css += k + ': ' + obj[k] + ';\n';
  }
  return css;
}

function makeColorRamp (props) {
  var c = ['ramp([' + props.attribute + ']'];
  if (props.range) {
    c.push(props.range);
  }
  if (props.bins) {
    c.push(props.bins);
  }
  if (props.quantification) {
    c.push(props.quantification);
  }
  return c.join(', ') + ')';
}

function makeWidthRamp (props) {
  var c = ['ramp([' + props.attribute + ']'];
  if (props.range) {
    c.push(props.range[0]);
    c.push(props.range[1]);
  }
  if (props.bins) {
    c.push(props.bins);
  }
  if (props.quantification) {
    c.push(props.quantification);
  }
  return c.join(', ') + ')';
}

// size
function pointSize (props) {
  var css = {};
  if (props.fixed !== undefined) {
    css['marker-width'] = props.fixed;
  } else if (props.attribute) {
    css['marker-width'] = makeWidthRamp(props);
  } else {
    throw new Error('size should contain a fixed value or an attribute');
  }
  return css;
  // return makeCartoCSS(css);
}

// fill
function pointFill (props) {
  var css = {};
  if (props.size) {
    css = pointSize(props.size);
  }
  if (props.color) {
    if (props.color.fixed !== undefined) {
      css['marker-fill'] = props.color.fixed;
    } else {
      css['marker-fill'] = makeColorRamp(props.color);
    }
    if (props.color.operation) {
      css['marker-comp-op'] = props.color.operation;
    }
    if (props.color.opacity) {
      css['marker-fill-opacity'] = props.color.opacity;
    }
  }
  return makeCartoCSS(css);
}

function polygonFill (props) {
  var css = {};
  if (props.color) {
    if (props.color.fixed !== undefined) {
      css['polygon-fill'] = props.color.fixed;
    } else {
      css['polygon-fill'] = makeColorRamp(props.color);
    }
    if (props.color.operation) {
      css['polygon-comp-op'] = props.color.operation;
    }
    if (props.color.opacity) {
      css['polygon-opacity'] = props.color.opacity;
    }
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

function polygonStroke (props) {
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

function isValidAttribute (attr) {
  return attr && attr !== '';
}

function pointAnimated (props) {
  var css = {};
  if (isValidAttribute(props.attribute)) {
    css['-torque-frame-count'] = props.steps;
    css['-torque-animation-duration'] = props.duration;
    css['-torque-time-attribute'] = '"' + props.attribute + '"';
    css['-torque-aggregation-function'] = '"count(1)"';
    css['-torque-resolution'] = props.resolution;
    css['-torque-data-aggregation'] = props.overlap;
  }
  return makeCartoCSS(css);
}

function _labels (props) {
  var css = {};
  if (isValidAttribute(props.attribute)) {
    css['text-name'] = '[' + props.attribute + ']';
    css['text-face-name'] = "'" + props.font + "'";
    if (props.fill) {
      css['text-size'] = props.fill.size.fixed;
      css['text-fill'] = props.fill.color.fixed;
    }
    css['text-label-position-tolerance'] = 0;
    if (props.halo) {
      css['text-halo-radius'] = props.halo.size.fixed;
      css['text-halo-fill'] = props.halo.color.fixed;
    }
    css['text-dy'] = props.offset === undefined ? -10 : props.offset;
    css['text-allow-overlap'] = props.overlap;
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
    polygon: _labels
  }
};

function renderBlock (block, geometryType) {
  var css = '';
  for (var k in block) {
    var f = cartocssFactory[k];
    if (f) {
      css += f[geometryType](block[k]);
    }
  }
  return css;
}

function generateCartoCSS (style, geometryType) {
  var styleDef = style.properties;
  var css = '';
  if (geometryType === 'point' && styleDef.animated && styleDef.animated.enabled && styleDef.animated.enabled !== 'false') {
    css += 'Map {\n';
    css += renderBlock({ animated: styleDef.animated }, geometryType);
    css += '}';
  }

  css += '#layer {\n';
  css += renderBlock(_.omit(styleDef, 'animated', 'labels'), geometryType);
  css += '}';

  // labels
  if (styleDef.labels && styleDef.labels.enabled && styleDef.labels.enabled !== 'false') {
    css += '\n#layer::labels {\n';
    css += renderBlock({ labels: styleDef.labels }, geometryType);
    css += '}';
  }
  return css;
}

function sizeToMeters (agg_size) {
  var m = {
    meters: 1,
    miles: 1.6,
    kilometers: 2
  };
  return agg_size.size.fixed * m[agg_size.distance_unit.fixed];
}

function aggToSQL (agg) {
  if (agg.operation === 'count') {
    return 'count(1)';
  }
  return agg.operation + '(' + agg.attribute + ')';
}

function hexabins (styleDef) {
  var sql = 'WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(!bbox!, greatest(!pixel_width!,!pixel_height!) * <%= size %>), greatest(!pixel_width!,!pixel_height!) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, count(1) as points_count, count(1)/power( <%= size %> * CDB_XYZ_Resolution(<%= z %>), 2 ) as points_density, 1 as cartodb_id FROM hgrid, <%= table %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell';
  return _.template(sql)({
    table: '<%= sql %>',
    size: sizeToMeters(styleDef.aggregation.aggr_size),
    z: 'CDB_ZoomFromScale(!scale_denominator!)'
  });
}

function regions (styleDef) {
  // TODO: add !bbox! tokens to help postgres?
  var sql = [
    'SELECT _poly.*, _merge.point_agg FROM <%= aggr_dateset %> _poly, lateral (',
    'SELECT <%= agg %> point_agg FROM (<%= table %>) _point where ST_Contains(_poly.the_geom_webmercator, _point.the_geom_webmercator) ) _merge'].join('\n');
  return _.template(sql)({
    table: '<%= sql %>',
    aggr_dateset: styleDef.aggregation.aggr_dateset,
    agg: aggToSQL(styleDef.aggregation.aggr_value)
  });
}

var SQLFactory = {
  hexabins: hexabins,
  regions: regions
};

function generateSQL (style, geometryType) {
  if (style.type === 'simple') {
    return null;
  }
  var fn = SQLFactory[style.type];
  if (fn === undefined) {
    throw new Error("can't generate SQL for aggregation " + style.type);
  }
  return fn(style);
}

var AggregatedFactory = {
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
  },
  regions: {
    geometryType: {
      point: 'polygon',
      line: null,
      polygon: null
    }
  }
};

/**
 * given a styleDefinition object and the geometry type generates the query wrapper and the
 */
function generateStyle (style, geometryType) {
  if (style.type !== 'simple' && geometryType !== 'point') {
    throw new Error('aggregated styling does not work with ' + geometryType);
  }

  // override geometryType for aggregated styles
  geometryType = AggregatedFactory[style.type].geometryType[geometryType];

  if (!geometryType) {
    throw new Error('geometry type not supported for ' + style.type);
  }

  return {
    cartoCSS: generateCartoCSS(style, geometryType),
    sql: generateSQL(style, geometryType)
  };
}

module.exports = {
  generateStyle: generateStyle
};
