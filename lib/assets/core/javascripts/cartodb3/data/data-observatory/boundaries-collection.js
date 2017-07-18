var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

// Interpolation boundary tag filters geometries to onlye show full coverage geometries
var FILTER_CLIPPED_GEOMS_IF_EXISTS = 'WHERE CASE WHEN EXISTS(SELECT 1 as cond FROM _data WHERE geom_tags ?\'boundary_type/tags.interpolation_boundary\' group by cond) THEN geom_tags ? \'boundary_type/tags.interpolation_boundary\' ELSE true END';

var ORDER_CLAUSE_GEOMS = 'ORDER BY geom_weight::numeric DESC;';

var BOUNDARIES_QUERY_PLAIN = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries( bounds => (SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), numer_id => {{{ measurement }}}) denoms WHERE valid_numer IS TRUE) SELECT * FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS + ' ' + ORDER_CLAUSE_GEOMS;

var BOUNDARIES_QUERY_NORMALIZE = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries(bounds => (SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), numer_id => {{{ measurement }}}, denom_id => {{{ denom_id }}}) denoms WHERE valid_numer IS TRUE AND valid_denom IS TRUE) SELECT * FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS + ' ' + ORDER_CLAUSE_GEOMS;

var BOUNDARIES_QUERY_TIMESPAN = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries(bounds => (SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), numer_id => {{{ measurement }}}, timespan => {{{ timespan }}}) denoms WHERE valid_numer IS TRUE AND valid_timespan = TRUE) SELECT * FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS + ' ' + ORDER_CLAUSE_GEOMS;

var BOUNDARIES_QUERY_NORMALIZE_TIMESPAN = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries( bounds => (SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), numer_id => {{{ measurement }}}, denom_id => {{{ denom_id }}}, timespan => {{{ timespan }}}) denoms WHERE valid_numer IS TRUE AND valid_denom IS TRUE AND valid_timespan is TRUE) SELECT * FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS + ' ' + ORDER_CLAUSE_GEOMS;

module.exports = BaseCollection.extend({
  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.geom_id;
    o.label = attrs.geom_name;

    return new BaseModel(o);
  },

  getLabels: function () {
    return this.pluck('label');
  },

  getValues: function () {
    return this.pluck('val');
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
