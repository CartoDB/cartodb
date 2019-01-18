var _ = require('underscore');
var camshaftReference = require('builder/data/camshaft-reference');
var Utils = require('builder/helpers/utils');
var InputQualitativeRamps = require('builder/components/input-color/input-qualitative-ramps/main-view.js');

var CONFIG = {
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

function makeColorRamp (props, isTorqueCategory) {
  var attribute = isTorqueCategory ? 'value' : props.attribute;
  var c = ['ramp([' + attribute + ']'];

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
    if (isTorqueCategory) {
      c.push('(' + _.map(props.domain, function (val, i) {
        return i + 1;
      }).join(', ') + ')');
    } else if (props.static) {
      // It comes from an autostyle, so we have to set the categories explicitly
      var parsedDomain = _.filter(props.domain, function (name) {
        return name !== '"Other"';
      });
      c.push('(' + parsedDomain.join(', ') + ')');
    } else {
      c.push('(' +
        _.filter(
          _.map(props.domain, function (val, i) {
            // Maps api converts null or empty value in empty string
            // and in the fill component we label them with a locale
            // so we use the same locale to generate the cartocss
            return val === '' ? _t('form-components.editors.fill.input-qualitative-ramps.null') : val;
          }),
          function (val) {
            return !_.isUndefined(val);
          }).join(', ') +
        ')'
      );
      c.push('"="');
    }
  }
  if (props.quantification) {
    c.push(props.quantification.toLowerCase());
  }

  if (isTorqueCategory) {
    c.push('"="');
  }

  return c.join(', ') + ')';
}

function makeWidthRamp (props) {
  var c = ['ramp([' + props.attribute + ']'];

  if (props.range) {
    var min = props.range[0];
    var max = props.range[1];

    c.push('range(' + min + ', ' + max + ')');
  }

  if (props.quantification) {
    var quantification = props.quantification.toLowerCase();

    if (props.bins) {
      c.push(quantification + '(' + props.bins + ')');
    } else {
      c.push(quantification);
    }
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
    // throw new Error('size should contain a fixed value or an attribute')
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
function pointFill (props, animationType) {
  var css = {};
  var color = props && props.color || {};
  var isTorqueCategory = animationType && !color.fixed;
  var markerFillOpacity = color.opacity;

  if (props.size) {
    css = pointSize(props.size);
  }
  if (color) {
    if (color.fixed !== undefined) {
      css['marker-fill'] = color.fixed;
    } else if (color.attribute) {
      css['marker-fill'] = makeColorRamp(color, isTorqueCategory);
    }
    if (color.operation) {
      css['marker-comp-op'] = color.operation;
    }

    css['marker-fill-opacity'] = markerFillOpacity != null ? markerFillOpacity : 1;

    if (hasImagesSelected(props.images) || hasImagesSelected(color.images)) {
      css['marker-file'] = markerFill(props.images || color.images, color);
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

function hasImagesSelected (images) {
  if (!images) return false;
  if (!_.isArray(images)) return false;

  return _.some(images, function (image) {
    return image !== '';
  });
}

function getFalsyCategory (category) {
  var DEFAULT_CATEGORY = "''";
  if (_isInvalidCategory(category)) return DEFAULT_CATEGORY;

  return category
    ? category === 0 ? '0' : DEFAULT_CATEGORY
    : category;
}

function markerFill (images, color) {
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
function pointStroke (props, animationType) {
  var css = {};

  if (animationType === 'heatmap') {
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
    if (props.isCategory) {
      css['-torque-aggregation-function'] = '"CDB_Math_Mode(value)"';
    } else {
      css['-torque-aggregation-function'] = '"count(1)"';
    }
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
    css['text-placement'] = props.placement;
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
    point: function (attrs, animationType) { return blending(attrs, 'marker', animationType); },
    line: function (attrs) { return blending(attrs, 'line'); },
    polygon: function (attrs) { return blending(attrs, 'polygon'); }
  }
};

var heatmapConversion = function (style, animated, configModel) {
  // modify the size
  style.fill = _.clone(style.fill);
  var ramp = style.fill.color.range;
  style.fill.size = style.fill.size || { fixed: 35 };

  style.fill.image = 'url(' + configModel.get('app_assets_base_url') + '/unversioned/images/alphamarker.png)';

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
  animation: function (style, configModel) {
    if (style.style === 'heatmap') {
      return heatmapConversion(style, true, configModel);
    }
  },

  heatmap: function (style, configModel) {
    return heatmapConversion(style, false, configModel);
  }
};

function renderBlock (block, geometryType, animationType) {
  var css = {};
  for (var k in block) {
    var f = cartocssFactory[k];
    if (f) {
      css = _.extend(css, f[geometryType](block[k], animationType));
    }
  }
  return makeCartoCSS(css, '  ');
}

function isTypeTorque (type) {
  return type === 'animation' || type === 'heatmap';
}

function isCategoryType (styleDef, geometryType) {
  if (geometryType === 'line') {
    var stroke = styleDef.stroke;
    return stroke && stroke.color && stroke.color.fixed == null;
  }
  var fill = styleDef.fill;
  return fill && fill.color && fill.color.fixed == null;
}

function generateCartoCSS (style, geometryType, configModel) {
  var css = '';
  var styleDef = style.properties;
  var isAnimatable = isTypeTorque(style.type);
  var isCategory = isCategoryType(styleDef, geometryType);
  var animationType = style.type === 'animation' && styleDef.style;

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
  if (geometryType === 'polygon') {
    omittedStyleAttrs.push('stroke');
  }
  css += '#layer {\n';
  css += renderBlock(_.omit(styleDef, omittedStyleAttrs), geometryType, animationType);
  css += '}';

  // Outline (stroke for polygons) #12412
  if (styleDef.stroke && geometryType === 'polygon') {
    css += '\n#layer::outline {\n';
    css += renderBlock({ stroke: styleDef.stroke }, geometryType);
    css += '}';
  }

  // Labels
  if (styleDef.labels && styleDef.labels.enabled && styleDef.labels.enabled !== 'false') {
    css += '\n#layer::labels {\n';
    css += renderBlock({ labels: styleDef.labels }, geometryType);
    css += '}';
  }

  // Animated Map trails
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
  var color = style.properties.fill.color;
  var columnType = color.attribute_type;
  var columnName = color.attribute;
  var hasOthers = color.range && color.range.length > InputQualitativeRamps.MAX_VALUES;
  var categoryCount = color.domain && color.domain.length;

  var s = ['select *, (CASE'];

  if (color.fixed != null || color.domain == null) {
    return null;
  }

  function _normalizeValue (v) {
    return v.replace(/\n/g, '\\n').replace(/\"/g, '\\"').replace(/'/g, "''");
  }

  for (var i = 0, l = categoryCount; i < l; i++) {
    var categoryName = color.domain[i];
    var categoryPos = i + 1;
    var value;

    if (columnType !== 'string' || categoryName === null) {
      value = categoryName;
    } else {
      value = "'" + _normalizeValue(categoryName.replace(/(^")|("$)/g, '')) + "'";
    }

    if (value != null) {
      s.push('WHEN "' + columnName + '" = ' + value + ' THEN ' + categoryPos);
    } else {
      s.push('WHEN "' + columnName + '" is NULL THEN ' + categoryPos);
    }
  }

  if (hasOthers) {
    s.push(' ELSE ' + (categoryCount + 1));
  }

  s.push(' END) as value FROM (<%= sql %>) __wrapped');
  return s.join(' ');
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

  if (style.type !== 'animation' && style.properties.aggregation === undefined) {
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
function generateStyle (style, geometryType, mapContext, configModel) {
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
    properties = conversion(style.properties, configModel);
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
    cartoCSS: generateCartoCSS(style, geometryType, configModel),
    sql: generateSQL(style, geometryType, mapContext),
    layerType: layerType
  };
}

function _isInvalidCategory (category) {
  return category.length === 0 || typeof category === 'undefined';
}

module.exports = {
  configure: function (cfg) {
    _.extend(CONFIG, cfg);
  },
  generateStyle: generateStyle,
  GENERIC_STYLE: CONFIG.GENERIC_STYLE
};
