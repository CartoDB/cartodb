var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

var FILTER_CLIPPED_GEOMS_IF_EXISTS = 'WHERE CASE WHEN (SELECT true as cond FROM _data WHERE geom_tags ?\'boundary_type/tags.cartographic_boundary\' group by cond) THEN geom_tags ? \'boundary_type/tags.cartographic_boundary\' ELSE true END;';

var BOUNDARIES_QUERY_PLAIN = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), NULL, {{{ measurement }}}, NULL, NULL) denoms WHERE valid_numer IS TRUE ORDER BY numgeoms DESC) SELECT DISTINCT on (geom_id) * FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS;

var BOUNDARIES_QUERY_NORMALIZE = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), NULL, {{{ measurement }}}, {{{ denom_id }}}, NULL) denoms WHERE valid_numer IS TRUE AND (valid_denom IS TRUE OR {{{ denom_id }}} IS NULL) ORDER BY numgeoms DESC) SELECT DISTINCT on (geom_id) * FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS;

var BOUNDARIES_QUERY_TIMESPAN = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), NULL, {{{ measurement }}}, NULL, {{{ timespan }}}) denoms WHERE valid_numer IS TRUE AND (valid_denom IS TRUE OR valid_denom IS NULL) ORDER BY numgeoms DESC) SELECT DISTINCT on (geom_id) * FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS;

var BOUNDARIES_QUERY_NORMALIZE_TIMESPAN = 'WITH _data as (SELECT * FROM OBS_GetAvailableGeometries((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), NULL, {{{ measurement }}}, {{{ denom_id }}}, {{{ timespan }}}) denoms WHERE valid_numer IS TRUE AND (valid_denom IS TRUE OR {{{ denom_id }}} IS NULL) ORDER BY numgeoms DESC) SELECT DISTINCT on (geom_id) * FROM _data ' + FILTER_CLIPPED_GEOMS_IF_EXISTS;

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
