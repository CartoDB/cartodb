var Backbone = require('backbone');
var _ = require('underscore');
var BaseCollection = require('./measurements-base-collection');

var MEASUREMENTS_QUERY = 'SELECT * FROM OBS_GetAvailableNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM (<%- query %>) q), <%- country %>) numers';

module.exports = BaseCollection.extend({
  initialize: function (models, options) {
    this._queryTemplate = _.template(MEASUREMENTS_QUERY);
    BaseCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    var o = {};
    // label and val to custom list compatibility
    o.id = attrs.numer_id;
    o.name = attrs.numer_name;
    o.description = attrs.numer_description;

    var tags = JSON.parse(attrs.numer_tags);
    for (var key in tags) {
      if (/^subsection\/tags/.test(key)) {
        o.filter = {
          id: key,
          name: tags[key]
        };
      }

      if (/^license/.test(key)) {
        o.license = tags[key];
      }
    }

    return new Backbone.Model(o);
  },

  getSelectedItem: function () {
    return _.first(
      this.where({ selected: true })
    );
  },

  getItem: function (value) {
    return _.first(
      this.where({ id: value })
    );
  },

  setSelected: function (value) {
    var selectedModel;
    var silent = { silent: true };

    this.each(function (mdl) {
      if (mdl.get('id') === value) {
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
  },

  removeSelected: function () {
    this.each(function (mdl) {
      mdl.set({
        selected: false
      });
    });
  }
});
