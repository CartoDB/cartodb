var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('builder/components/custom-list/custom-list-item-model');

var FILTERS_QUERY_WITH_REGION = "SELECT count(*) num_measurements, tag.key subsection_id, tag.value subsection_name FROM OBS_GetAvailableNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), {{{ region }}}) numers, Jsonb_Each(numers.numer_tags) tag WHERE tag.key like 'subsection%' GROUP BY tag.key, tag.value";

module.exports = BaseCollection.extend({
  initialize: function (models, options) {
    this.type = 'multiple';

    BaseCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.val = attrs.subsection_id;
    o.label = attrs.subsection_name;
    o.items = attrs.num_measurements;

    return new BaseModel(o);
  },

  setSelected: function (value) {
    var silentTrue = { silent: true };

    if (_.isArray(value)) {
      this.each(function (mdl) {
        if (_.contains(value, mdl.getValue())) {
          mdl.set({
            selected: true
          }, silentTrue);
        } else {
          mdl.set({
            selected: false
          }, silentTrue);
        }
      });
    } else {
      this.each(function (mdl) {
        if (mdl.getValue() === value) {
          mdl.set({
            selected: true
          }, silentTrue);
        } else {
          mdl.set({
            selected: false
          }, silentTrue);
        }
      });
    }
  },

  getSelected: function () {
    return this.filter(function (mdl) {
      return mdl.get('selected') === true;
    });
  },

  buildQuery: function (options) {
    return FILTERS_QUERY_WITH_REGION;
  }
});
