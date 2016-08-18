var _ = require('underscore');
var camshaftReference = require('../../data/camshaft-reference');
var Utils = require('../../helpers/utils');

var CONFIG = {
  HEATMAP_IMAGE: 'url(http://s3.amazonaws.com/com.cartodb.assets.static/alphamarker.png)',
  GENERIC_STYLE: camshaftReference.getDefaultCartoCSSForType(),
  DEFAULT_HEATMAP_COLORS: ['blue', 'cyan', 'lightgreen', 'yellow', 'orange', 'red']
};

// utilities
function _null () { return ''; }

function makeCartoCSS (obj, prefix) {
  var css = '';
  prefix = prefix || '';
  for (var k in obj) {
    css += prefix + k + ': ' + obj[k] + ';\n';
  }
  return css;
}

function makeColorRamp (props) {
  var c = ['ramp([' + props.attribute + ']'];
  if (props.range) {
    if (_.isArray(props.range)) {
      c.push('(' + props.range.join(', ') + ')');
    } else {
      // colorramp name
      c.push(props.range);
      if (props.bins) {
        c.push(props.bins);
      }
    }
  }
  if (props.domain) {
    c.push('(' + props.domain.map(String).join(', ') + ')');
  }
  if (props.quantification) {
    c.push(props.quantification.toLowerCase());
  }
  return c.join(', ') + ')';
}

function makeWidthRamp (props) {
  var c = ['ramp([' + props.attribute + ']'];
  if (props.range) {
    c.push(props.range[0]);
    c.push(props.range[1]);
    if (props.bins) {
      c.push(props.bins);
    }
  }
  if (props.quantification) {
    c.push(props.quantification.toLowerCase());
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
    // throw new Error('size should contain a fixed value or an attribute');
  }
  return css;
}

function blending (b, geometryType, animatedType) {
  var css = {};
  var property = geometryType + '-comp-op';
  if (b !== 'none' && b !== undefined && animatedType !== 'heatmap') {
    if (animatedType === 'simple') {
      property = 'comp-op';
    }
    css[property] = b;
  }
  return css;
}

// fill
function pointFill (props, animatedType) {
  var css = {};
  if (props.size) {
    css = pointSize(props.size);
  }
  if (props.color) {
    if (props.color.fixed !== undefined) {
      css['marker-fill'] = props.color.fixed;
    } else if (props.color.attribute) {
      css['marker-fill'] = makeColorRamp(props.color);
    }
    if (props.color.operation) {
      css['marker-comp-op'] = props.color.operation;
    }
    if (_.isNumber(props.color.opacity)) {
      css['marker-fill-opacity'] = props.color.opacity;
    }
    if (props.image) {
      css['marker-file'] = props.image;
    }
  }
  if (!animatedType) {
    css['marker-allow-overlap'] = true;
  }
  return css;
}

function polygonFill (props) {
  var css = {};
  if (props.color) {
    if (props.color.fixed !== undefined) {
      css['polygon-fill'] = props.color.fixed;
    } else if (props.color.attribute) {
      css['polygon-fill'] = makeColorRamp(props.color);
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

// stroke
function pointStroke (props, animatedType) {
  var css = {};

  if (animatedType === 'heatmap') {
    return css;
  }

  if (props.size) {
    css['marker-line-width'] = props.size.fixed;
  }
  if (props.color) {
    if (props.color.fixed !== undefined) {
      css['marker-line-color'] = props.color.fixed;
    } else if (props.color.attribute) {
      css['marker-line-color'] = makeColorRamp(props.color);
    }
    if (_.isNumber(props.color.opacity)) {
      css['marker-line-opacity'] = props.color.opacity;
    }
  }
  return css;
}

function polygonStroke (props) {
  var css = {};
  if (props.size) {
    if (props.size.fixed !== undefined) {
      css['line-width'] = props.size.fixed;
    } else if (props.size.attribute) {
      css['line-width'] = makeWidthRamp(props.size);
    }
  }
  if (props.color) {
    if (props.color.fixed) {
      css['line-color'] = props.color.fixed;
    } else if (props.color.attribute) {
      css['line-color'] = makeColorRamp(props.color);
    }
    if (_.isNumber(props.color.opacity)) {
      css['line-opacity'] = props.color.opacity;
    }
  }
  return css;
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
    css['-torque-data-aggregation'] = props.overlap ? 'cumulative' : 'linear';
  }
  return css;
}

function _labels (props) {
  var css = {};
  if (isValidAttribute(props.attribute)) {
    css['text-name'] = '[' + props.attribute + ']';
    css['text-face-name'] = "'" + props.font + "'";
    if (props.fill) {
      css['text-size'] = props.fill.size.fixed;

      if (props.fill.color.opacity != null && props.fill.color.opacity < 1) {
        css['text-fill'] = Utils.hexToRGBA(props.fill.color.fixed, props.fill.color.opacity);
      } else {
        css['text-fill'] = props.fill.color.fixed;
      }
    }
    css['text-label-position-tolerance'] = 0;
    if (props.halo) {
      css['text-halo-radius'] = props.halo.size.fixed;

      if (props.halo.color.opacity != null && props.halo.color.opacity < 1) {
        css['text-halo-fill'] = Utils.hexToRGBA(props.halo.color.fixed, props.halo.color.opacity);
      } else {
        css['text-halo-fill'] = props.halo.color.fixed;
      }
    }
    css['text-dy'] = props.offset === undefined ? -10 : props.offset;
    css['text-allow-overlap'] = props.overlap === undefined ? true : props.overlap;
    css['text-placement'] = 'point';
    css['text-placement-type'] = 'dummy';
  }
  return css;
}

function imageFilters (props) {
  var css = {};
  if (props.ramp) {
    css['image-filters'] = 'colorize-alpha(' + props.ramp.join(',') + ')';
  }
  return css;
}

var cartocssFactory = {
  animated: {
    point: pointAnimated,
    line: _null,
    polygon: _null
  },

  trails: {
    point: trails,
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
  },

  imageFilters: {
    point: imageFilters,
    line: imageFilters,
    polygon: imageFilters
  },

  blending: {
    point: function (attrs, animatedType) { return blending(attrs, 'marker', animatedType); },
    line: function (attrs) { return blending(attrs, 'line'); },
    polygon: function (attrs) { return blending(attrs, 'polygon'); }
  }
};

var heatmapConversion = function (style, animated) {
  // modify the size
  style.fill = _.clone(style.fill);
  var ramp = style.fill.color.range;
  style.fill.size = style.fill.size || { fixed: 35 };
  style.fill.image = CONFIG.HEATMAP_IMAGE;
  style.fill.color = {
    fixed: style.fill.color.fixed || 'white',
    opacity: style.fill.color.opacity
  };

  // switch to torque
  // add image filters
  if (ramp !== undefined) {
    style.imageFilters = {
      ramp: _.isArray(ramp) ? ramp : CONFIG.DEFAULT_HEATMAP_COLORS
    };
  }
  return style;
};

var styleConversion = {
  animation: function (style) {
    if (style.style === 'heatmap') {
      return heatmapConversion(style, true);
    }
  },

  heatmap: function (style) {
    return heatmapConversion(style, false);
  }
};

function renderBlock (block, geometryType, animatedType) {
  var css = {};
  for (var k in block) {
    var f = cartocssFactory[k];
    if (f) {
      css = _.extend(css, f[geometryType](block[k], animatedType));
    }
  }
  return makeCartoCSS(css, '  ');
}

function isTypeTorque (type) {
  return type === 'animation' || type === 'heatmap';
}

function generateCartoCSS (style, geometryType) {
  var css = '';

  var styleDef = style.properties;
  var isAnimatable = isTypeTorque(style.type);
  if (geometryType === 'point' && isAnimatable) {
    css += 'Map {\n';

    css += renderBlock({ animated: styleDef.animated }, geometryType);
    css += '}\n';
  }

  css += '#layer {\n';
  css += renderBlock(_.omit(styleDef, 'animated', 'labels'), geometryType, (styleDef.animated && styleDef.style));
  css += '}';

  // labels
  if (styleDef.labels && styleDef.labels.enabled && styleDef.labels.enabled !== 'false') {
    css += '\n#layer::labels {\n';
    css += renderBlock({ labels: styleDef.labels }, geometryType);
    css += '}';
  }

  if (isAnimatable && styleDef.animated.trails && styleDef.animated.trails > 0) {
    css += cartocssFactory.trails[geometryType](styleDef);
  }

  return css;
}

function trails (def) {
  var baseWidth = def.fill.size && parseInt(def.fill.size.fixed, 10);
  var baseOpacity = def.fill.color.opacity != null ? def.fill.color.opacity : 1;
  if (!baseWidth) return '';
  return '\n' +
  _.range(1, parseInt(def.animated.trails, 10) + 1)
    .map(function (t) {
      return '#layer[frame-offset=' + t + '] {\n' +
      makeCartoCSS({ 'marker-width': baseWidth + 2 * t }, '  ') +
      makeCartoCSS({ 'marker-fill-opacity': baseOpacity / (2 * t) }, '  ') +
      '}';
    }
  ).join('\n');
}

function aggToSQL (agg) {
  if (agg.operator.toLowerCase() === 'count') {
    return 'count(1)';
  }
  return agg.operator + '(' + agg.attribute + ')';
}

function regionTableMap (level) {
  var map = {
    'countries': 'aggregation.agg_admin0',
    'provinces': 'aggregation.agg_admin1'
  };
  return map[level];
}

function hexabins (style, mapContext) {
  var aggregation = style.properties.aggregation;
  var sql = 'WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(!bbox!, CDB_XYZ_Resolution(<%= z %>) * <%= size %>), CDB_XYZ_Resolution(<%= z %>) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, <%= agg %> as agg_value, count(1)/power( <%= size %> * CDB_XYZ_Resolution(<%= z %>), 2 ) as agg_value_density, row_number() over () as cartodb_id FROM hgrid, <%= table %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell';
  return _.template(sql)({
    table: '(<%= sql %>)',
    size: aggregation.size,
    agg: aggToSQL(aggregation.value),
    z: mapContext.zoom
  });
}

function squares (style, mapContext) {
  var aggregation = style.properties.aggregation;
  var sql = 'WITH hgrid AS (SELECT CDB_RectangleGrid ( ST_Expand(!bbox!, CDB_XYZ_Resolution(<%= z %>) * <%= size %>), CDB_XYZ_Resolution(<%= z %>) * <%= size %>, CDB_XYZ_Resolution(<%= z %>) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, <%= agg %> as agg_value, <%= agg %> /power( <%= size %> * CDB_XYZ_Resolution(<%= z %>), 2 ) as agg_value_density, row_number() over () as cartodb_id FROM hgrid, <%= table %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell';
  return _.template(sql)({
    table: '(<%= sql %>)',
    size: aggregation.size,
    agg: aggToSQL(aggregation.value),
    z: mapContext.zoom
  });
}

function regions (style) {
  var aggregation = style.properties.aggregation;
  // TODO: add !bbox! tokens to help postgres with FDW join
  // I tested this on postgres 9.6, the planner seems to be doing weird, it takes
  // 7 seconds to query a simple tile with no join, I hope 9.5 works much better
  // Maybe using a CTE with the FDW table improves the thing
  // Normalize also by area using the real area (not projected one). Using the_geom_webmercator for that instead of the_geom
  // to avoid extra data going through the network in the FDW
  // use 2.6e-06 as minimum area (tile size at zoom level 31)
  var sql = [
    'SELECT _poly.*, _merge.points_agg/GREATEST(0.0000026, ST_Area((ST_Transform(the_geom, 4326))::geography)) as agg_value_density, _merge.points_agg as agg_value FROM <%= aggr_dataset %> _poly, lateral (',
    'SELECT <%= agg %> points_agg FROM (<%= table %>) _point where ST_Contains(_poly.the_geom_webmercator, _point.the_geom_webmercator) ) _merge'].join('\n');
  return _.template(sql)({
    table: '<%= sql %>',
    aggr_dataset: regionTableMap(aggregation.dataset),
    agg: aggToSQL(aggregation.value)
  });
}

function animation (style, mapContext) {

}

var SQLFactory = {
  hexabins: hexabins,
  squares: squares,
  regions: regions,
  animation: animation
};

function generateSQL (style, geometryType, mapContext) {
  if (SQLFactory[style.type] === undefined) {
    return null;
  }
  if (style.properties.aggregation === undefined) {
    throw new Error('aggregation properties not available');
  }
  var fn = SQLFactory[style.type];
  if (fn === undefined) {
    throw new Error("can't generate SQL for aggregation " + style.type);
  }
  return fn(style, mapContext);
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
  squares: {
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
function generateStyle (style, geometryType, mapContext) {
  if (style.type === 'none') {
    return {
      cartoCSS: CONFIG.GENERIC_STYLE,
      sql: null,
      layerType: 'CartoDB'
    };
  }

  if (style.type !== 'simple' && geometryType !== 'point') {
    throw new Error('aggregated styling does not work with ' + geometryType);
  }

  // pre style conversion
  // some styles need some conversion, for example aggregated based on
  // torque need to move from aggregation to animated properties
  var conversion = styleConversion[style.type];
  var properties;
  if (conversion) {
    properties = conversion(style.properties);
    if (properties) {
      style.properties = properties;
    }
  }

  // override geometryType for aggregated styles
  var geometryMapping = AggregatedFactory[style.type];
  if (geometryMapping) {
    geometryType = geometryMapping.geometryType[geometryType];
  }

  if (!geometryType) {
    throw new Error('geometry type not supported for ' + style.type);
  }

  var layerType = style.type === 'heatmap' || style.type === 'animation' ? 'torque' : 'CartoDB';

  return {
    cartoCSS: generateCartoCSS(style, geometryType),
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
