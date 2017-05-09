var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

var REGIONS_QUERY = "SELECT count(*) num_measurements, tag.key region_id, tag.value region_name FROM OBS_GetAvailableNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q)) numers, Jsonb_Each(numers.numer_tags) tag WHERE tag.key like 'section%' GROUP BY tag.key, tag.value";

module.exports = BaseCollection.extend({
  buildQuery: function () {
    return _.template(REGIONS_QUERY);
  },

  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.region_id;
    o.label = attrs.region_name.replace(/["]+/g, '');

    o.renderOptions = {
      measurements: attrs.num_measurements
    };

    return new BaseModel(o);
  }
});
