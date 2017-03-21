var _ = require('underscore');
var BaseCollection = require('./measurements-base-collection');
var BaseModel = require('../../../custom-list/custom-list-item-model');

var MEASUREMENTS_QUERY = 'SELECT * FROM OBS_GetAvailableNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), <%- country %>) numers';

module.exports = BaseCollection.extend({
  initialize: function (models, options) {
    this._queryTemplate = _.template(MEASUREMENTS_QUERY);
    BaseCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    var o = {};
    // label and val to custom list compatibility
    o.val = attrs.numer_id;
    o.label = attrs.numer_name;
    o.description = attrs.numer_description;
    // a measurement can belong to more than one category (filter)
    o.filter = [];
    var tags = JSON.parse(attrs.numer_tags);
    for (var key in tags) {
      if (/^subsection/.test(key)) {
        o.filter.push({
          id: key,
          name: tags[key]
        });
      }

      if (/^license/.test(key)) {
        o.license = tags[key];
      }
    }

    return new BaseModel(o);
  },

  getItem: function (value) {
    return this.findWhere({ val: value });
  },

  setSelected: function (value) {
    var selectedModel;
    var silent = { silent: true };

    this.each(function (mdl) {
      if (mdl.getValue() === value) {
        mdl.set({
          selected: true
        });
        selectedModel = mdl;
      } else {
        mdl.set({
          selected: false
        }, silent);
      }
    });
    return selectedModel;
  }
});
