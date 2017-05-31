var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

var BOUNDARIES_QUERY_PLAIN = 'SELECT * FROM OBS_GetAvailableGeometries( \
  (SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), \
  NULL, \
  {{{ measurement }}}, \
  NULL, \
  NULL) denoms \
  WHERE valid_numer IS TRUE \
  ORDER BY numgeoms DESC';

var BOUNDARIES_QUERY_NORMALIZE = 'SELECT * FROM OBS_GetAvailableGeometries( \
  (SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), \
  NULL, \
  {{{ measurement }}}, \
  {{{ normalize }}}, \
  NULL) denoms \
  WHERE valid_numer IS TRUE \
  AND (valid_denom IS TRUE OR {{{ normalize }}} IS NULL) \
  ORDER BY numgeoms DESC';

var BOUNDARIES_QUERY_TIMESPAN = 'SELECT * FROM OBS_GetAvailableGeometries( \
  (SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), \
  NULL, \
  {{{ measurement }}}, \
  NULL, \
  {{{ timespan }}}) denoms \
  WHERE valid_numer IS TRUE \
  AND valid_timespan IS TRUE \
  ORDER BY numgeoms DESC';

var BOUNDARIES_QUERY_NORMALIZE_TIMESPAN = 'SELECT * FROM OBS_GetAvailableGeometries( \
  (SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), \
  NULL, \
  {{{ measurement }}}, \
  {{{ normalize }}}, \
  {{{ timespan }}}) denoms \
  WHERE valid_numer IS TRUE \
  AND (valid_denom IS TRUE OR {{{ normalize }}} IS NULL) \
  AND valid_timespan IS TRUE \
  ORDER BY numgeoms DESC';

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
    if (options.normalize != null && options.timespan != null) {
      return _.template(BOUNDARIES_QUERY_NORMALIZE_TIMESPAN);
    } else {
      if (options.normalize != null) {
        return _.template(BOUNDARIES_QUERY_NORMALIZE);
      } else if (options.timespan != null) {
        return _.template(BOUNDARIES_QUERY_TIMESPAN);
      } else {
        return _.template(BOUNDARIES_QUERY_PLAIN);
      }
    }
  }

});
