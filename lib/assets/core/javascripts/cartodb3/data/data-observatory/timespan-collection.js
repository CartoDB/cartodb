var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

var TIMESPAN_QUERY_WITH_NORMALIZE = 'SELECT * FROM OBS_GetAvailableTimespans((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), NULL, {{{ measurement }}}, {{{ normalize }}}) denoms WHERE valid_numer IS TRUE AND (valid_denom IS TRUE OR {{{ normalize }}} IS NULL)';

module.exports = BaseCollection.extend({
  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.timespan_id;
    o.label = attrs.timespan_name;

    return new BaseModel(o);
  },

  buildQuery: function (options) {
    return _.template(TIMESPAN_QUERY_WITH_NORMALIZE);
  }
});
