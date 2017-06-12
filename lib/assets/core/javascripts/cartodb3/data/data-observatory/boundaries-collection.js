var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

var BOUNDARIES_QUERY_PLAIN = 'SELECT * FROM OBS_GetAvailableGeometries((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q),  NULL, {{{ measurement }}}, NULL, NULL) denoms WHERE valid_numer IS TRUE ORDER BY numgeoms DESC LIMIT 15';

var BOUNDARIES_QUERY_NORMALIZE = 'SELECT * FROM OBS_GetAvailableGeometries((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), NULL, {{{ measurement }}}, {{{ denom_id }}}, NULL) denoms WHERE valid_numer IS TRUE AND (valid_denom IS TRUE OR {{{ denom_id }}} IS NULL) ORDER BY numgeoms DESC LIMIT 15';

var BOUNDARIES_QUERY_TIMESPAN = 'SELECT * FROM OBS_GetAvailableGeometries((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), NULL, {{{ measurement }}}, NULL, {{{ timespan }}}) denoms WHERE valid_numer IS TRUE AND valid_timespan IS TRUE ORDER BY numgeoms DESC LIMIT 15';

var BOUNDARIES_QUERY_NORMALIZE_TIMESPAN = 'SELECT * FROM OBS_GetAvailableGeometries((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), NULL, {{{ measurement }}}, {{{ denom_id }}}, {{{ timespan }}}) denoms WHERE valid_numer IS TRUE AND (valid_denom IS TRUE OR {{{ denom_id }}} IS NULL) AND valid_timespan IS TRUE ORDER BY numgeoms DESC LIMIT 15';

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
      return _.template(BOUNDARIES_QUERY_NORMALIZE_TIMESPAN);
    } else {
      if (options.denom_id != null) {
        return _.template(BOUNDARIES_QUERY_NORMALIZE);
      } else if (options.timespan != null) {
        return _.template(BOUNDARIES_QUERY_TIMESPAN);
      } else {
        return _.template(BOUNDARIES_QUERY_PLAIN);
      }
    }
  }

});
