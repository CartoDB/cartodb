var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('builder/components/custom-list/custom-list-item-model');

var NORMALIZE_QUERY_WITH_MEASUREMENT = 'SELECT * FROM OBS_GetAvailableDenominators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), NULL, {{{ measurement }}}) denoms WHERE valid_numer IS TRUE';

module.exports = BaseCollection.extend({
  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.denom_id;
    o.label = attrs.denom_name;

    return new BaseModel(o);
  },

  buildQuery: function (options) {
    return NORMALIZE_QUERY_WITH_MEASUREMENT;
  }
});
