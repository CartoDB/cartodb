var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('builder/components/custom-list/custom-list-item-model');

// Interpolation boundary tag filters geometries to only show full coverage geometries
var FILTER_CLIPPED_GEOMS_IF_EXISTS = 'WHERE CASE WHEN EXISTS(SELECT 1 as cond FROM _data WHERE geom_tags ?\'boundary_type/tags.interpolation_boundary\' group by cond) THEN geom_tags ? \'boundary_type/tags.interpolation_boundary\' ELSE true END';

var ORDER_CLAUSE_GEOMS = 'ORDER BY geom_weight::numeric DESC;';

var COMMON_DATA_QUERY = 'bounds => (SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), numer_id => {{{ measurement }}}, number_geometries => (SELECT CDB_EstimateRowCount(\'{{{ query }}}\')::INTEGER)';

var BOUNDARIES_QUERY_PLAIN = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries( ' + COMMON_DATA_QUERY + ' ) denoms WHERE valid_numer IS TRUE) SELECT *, rank() OVER (ORDER BY score DESC) FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS + ' ' + ORDER_CLAUSE_GEOMS;

var BOUNDARIES_QUERY_NORMALIZE = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries(' + COMMON_DATA_QUERY + ', denom_id => {{{ denom_id }}}) denoms WHERE valid_numer IS TRUE AND valid_denom IS TRUE) SELECT *, rank() OVER (ORDER BY score DESC) FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS + ' ' + ORDER_CLAUSE_GEOMS;

var BOUNDARIES_QUERY_TIMESPAN = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries(' + COMMON_DATA_QUERY + ', timespan => {{{ timespan }}}) denoms WHERE valid_numer IS TRUE AND valid_timespan = TRUE) SELECT *, rank() OVER (ORDER BY score DESC) FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS + ' ' + ORDER_CLAUSE_GEOMS;

var BOUNDARIES_QUERY_NORMALIZE_TIMESPAN = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries(' + COMMON_DATA_QUERY + ', denom_id => {{{ denom_id }}}, timespan => {{{ timespan }}}) denoms WHERE valid_numer IS TRUE AND valid_denom IS TRUE AND valid_timespan is TRUE) SELECT *, rank() OVER (ORDER BY score DESC) FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS + ' ' + ORDER_CLAUSE_GEOMS;

module.exports = BaseCollection.extend({
  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.geom_id;
    o.label = attrs.geom_name;
    o.rank = attrs.rank;

    return new BaseModel(o);
  },

  getLabels: function () {
    return this.pluck('label');
  },

  getValues: function () {
    return this.pluck('val');
  },

  getPreSelectedBoundaryValue: function () {
    var boundary = this.models.filter(
      function (boundary) { return boundary.attributes.rank === 1; }
    ).shift();

    return boundary && boundary.attributes && boundary.attributes.val;
  },

  buildQuery: function (options) {
    if (options.denom_id != null && options.timespan != null) {
      return BOUNDARIES_QUERY_NORMALIZE_TIMESPAN;
    } else {
      if (options.denom_id != null) {
        return BOUNDARIES_QUERY_NORMALIZE;
      } else if (options.timespan != null) {
        return BOUNDARIES_QUERY_TIMESPAN;
      } else {
        return BOUNDARIES_QUERY_PLAIN;
      }
    }
  }

});
