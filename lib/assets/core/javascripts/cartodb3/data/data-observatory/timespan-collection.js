var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

var TIMESPAN_QUERY_WITH_NORMALIZE = 'SELECT * FROM OBS_GetAvailableDenominators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), NULL, {{{ measurement }}}, {{{ normalize }}}) denoms WHERE valid_numer IS TRUE AND valid_timespan IS TRUE';
var TIMESPAN_QUERY_WITHOUT_NORMALIZE = 'SELECT * FROM OBS_GetAvailableDenominators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), NULL, {{{ measurement }}}) denoms WHERE valid_numer IS TRUE';

module.exports = BaseCollection.extend({
  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.denom_id;
    o.label = attrs.denom_name;

    return new BaseModel(o);
  },

  buildQuery: function (options) {
    return options.normalize != null
            ? _.template(TIMESPAN_QUERY_WITH_NORMALIZE)
            : _.template(TIMESPAN_QUERY_WITHOUT_NORMALIZE);
  }
});
