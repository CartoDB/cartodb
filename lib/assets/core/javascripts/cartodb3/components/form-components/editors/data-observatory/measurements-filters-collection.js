var Backbone = require('backbone');
var _ = require('underscore');
var BaseCollection = require('./measurements-base-collection');

var FILTERS_QUERY = 'SELECT count(*) num_measurements, tag.key subsection_id, tag.value subsection_name FROM obs_getavailablenumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), <%- country %>)) numers, Jsonb_Each(numers.numer_tags) tag WHERE tag.key like "subsection%"" GROUP BY tag.key, tag.value';

module.exports = BaseCollection.extend({
  initialize: function (models, options) {
    this._queryTemplate = _.template(FILTERS_QUERY);
    BaseCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    var o = {};
    o.id = attrs.subsection_id;
    o.name = attrs.subsection_name;

    return new Backbone.Model(o);
  }
});
