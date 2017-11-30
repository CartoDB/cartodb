var _ = require('underscore');
var aggToSQL = function (agg) {
  if (agg.operator.toLowerCase() === 'count') {
    return 'count(1)';
  }
  return agg.operator + '(' + agg.attribute + ')';
};

var styleTypes = {
  hexabins: function (style, mapContext) {
    var aggregation = style.properties.aggregation;
    var sql = 'WITH hgrid AS (SELECT CDB_HexagonGrid(ST_Expand(!bbox!, CDB_XYZ_Resolution(<%= z %>) * <%= size %>), CDB_XYZ_Resolution(<%= z %>) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, <%= agg %> as agg_value, count(1)/power( <%= size %> * CDB_XYZ_Resolution(<%= z %>), 2 ) as agg_value_density, row_number() over () as cartodb_id FROM hgrid, <%= table %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell';

    return _.template(sql)({
      table: '(<%= sql %>)',
      size: aggregation.size,
      agg: aggToSQL(aggregation.value),
      z: mapContext.zoom
    });
  },

  squares: function (style, mapContext) {
    var aggregation = style.properties.aggregation;
    var sql = 'WITH hgrid AS (SELECT CDB_RectangleGrid ( ST_Expand(!bbox!, CDB_XYZ_Resolution(<%= z %>) * <%= size %>), CDB_XYZ_Resolution(<%= z %>) * <%= size %>, CDB_XYZ_Resolution(<%= z %>) * <%= size %>) as cell) SELECT hgrid.cell as the_geom_webmercator, <%= agg %> as agg_value, <%= agg %> /power( <%= size %> * CDB_XYZ_Resolution(<%= z %>), 2 ) as agg_value_density, row_number() over () as cartodb_id FROM hgrid, <%= table %> i where ST_Intersects(i.the_geom_webmercator, hgrid.cell) GROUP BY hgrid.cell';

    return _.template(sql)({
      table: '(<%= sql %>)',
      size: aggregation.size,
      agg: aggToSQL(aggregation.value),
      z: mapContext.zoom
    });
  },

  regions: function (style) {
    var aggregation = style.properties.aggregation;
    var regionTableMap = function (level) {
      var map = {
        'countries': 'aggregation.agg_admin0',
        'provinces': 'aggregation.agg_admin1'
      };
      return map[level];
    };

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
  },

  animation: function (style, mapContext) {
    var color = style.properties.fill.color;
    var columnType = color.attribute_type;
    var columnName = color.attribute;
    var hasOthers = color.range && color.range.length > InputColorCategories.MAX_VALUES;
    var categoryCount = color.domain && color.domain.length;
    var _normalizeValue = function (v) {
      return v.replace(/\n/g, '\\n').replace(/\"/g, '\\"').replace();
    }
    var s = ['select *, (CASE'];

    if (color.fixed != null || color.domain == null) {
      return null;
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
}


module.exports = {
  getSQLByStyleType: function (styleType, style, mapContext) {
    if (!styleTypes[styleType]) {
      return;
    }

    return styleTypes[styleType](style, mapContext);
  }
};
