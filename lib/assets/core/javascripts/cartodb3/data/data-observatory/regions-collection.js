var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

var REGIONS_QUERY = "SELECT count(*) num_measurements, tag.key region_id, tag.value region_name FROM obs_getavailablenumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q) numers, Jsonb_Each(numers.numer_tags) tag WHERE tag.key like 'section%' GROUP BY tag.key, tag.value";

module.exports = BaseCollection.extend({
  initialize: function (models, options) {
    this._queryTemplate = _.template(REGIONS_QUERY);
    BaseCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.region_id;
    o.label = attrs.region_name;
    o.items = attrs.num_measurements;

    return new BaseModel(o);
  }
});
