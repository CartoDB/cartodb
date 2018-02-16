var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('builder/components/custom-list/custom-list-item-model');

var TIMESPAN_QUERY_WITH_NORMALIZE = 'SELECT * FROM OBS_GetAvailableTimespans((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), NULL, {{{ measurement }}}, {{{ denom_id }}}) denoms WHERE valid_numer IS TRUE AND (valid_denom IS TRUE OR {{{ denom_id }}} IS NULL) ORDER BY timespan_name DESC';

var TIMESPAN_QUERY_WITHOUT_NORMALIZE = 'SELECT * FROM OBS_GetAvailableTimespans((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), NULL, {{{ measurement }}}, NULL) denoms WHERE valid_numer IS TRUE ORDER BY timespan_name DESC';

module.exports = BaseCollection.extend({
  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.timespan_id;
    o.label = attrs.timespan_name;

    return new BaseModel(o);
  },

  buildQuery: function (options) {
    if (options.denom_id != null) {
      return TIMESPAN_QUERY_WITH_NORMALIZE;
    } else {
      return TIMESPAN_QUERY_WITHOUT_NORMALIZE;
    }
  },

  selectFirstAsDefault: function () {
    var first = this.first();
    if (first) {
      this.setSelected(first.getValue());
    }
  }
});
