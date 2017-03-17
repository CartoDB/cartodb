var _ = require('underscore');
var BaseCollection = require('./measurements-base-collection');
var FilterModel = require('./measurements-filter-model');

var FILTERS_QUERY = "SELECT count(*) num_measurements, tag.key subsection_id, tag.value subsection_name FROM obs_getavailablenumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), <%- country %>) numers, Jsonb_Each(numers.numer_tags) tag WHERE tag.key like 'subsection%' GROUP BY tag.key, tag.value";

module.exports = BaseCollection.extend({
  initialize: function (models, options) {
    this._queryTemplate = _.template(FILTERS_QUERY);
    BaseCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    // label and val to custom list compatibility
    var o = {};
    o.id = attrs.subsection_id;
    o.name = attrs.subsection_name;

    return new FilterModel(o);
  },

  setSelected: function (value) {
    var silentTrue = { silent: true };

    if (_.isArray(value)) {
      this.each(function (mdl) {
        if (_.contains(value, mdl.get('id'))) {
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
        if (mdl.get('id') === value) {
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

  // these methods below is to use this collection as base collection for custom list view.
  getSelectedItem: function () {
    return _.first(this.getSelected());
  },

  search: function () {
    return _(this.models);
  },

  containsValue: function (value) {
    return this.length > 0;
  }
});
