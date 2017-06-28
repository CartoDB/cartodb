var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('../../components/custom-list/custom-list-item-model');

// region is a filter by itself
var MEASUREMENTS_QUERY_WITH_FILTERS = 'SELECT * FROM OBS_GetAvailableNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), {{{ filters }}}) numers ORDER BY numer_name ASC';

module.exports = BaseCollection.extend({
  initialize: function (models, options) {
    this.selected = new BaseModel();
    this.on('change:selected', this._onItemSelected, this);

    BaseCollection.prototype.initialize.call(this, models, options);
  },

  model: function (attrs, opts) {
    return new BaseModel(attrs, opts);
  },

  getSelectedItem: function () {
    return this.selected;
  },

  _onItemSelected: function (mdl) {
    this.selected.set(_.clone(mdl.attributes));
  },

  _onFetchSuccess: function (data) {
    var models = data.rows;

    models = _.map(models, function (model) {
      var o = {};
      // label and val to custom list compatibility
      o.val = model.numer_id;
      o.label = model.numer_name;
      o.description = model.numer_description;
      o.type = model.numer_type;
      o.aggregate = model.numer_aggregate;
      // a measurement can belong to more than one category (filter)
      o.filter = [];
      var tags = model.numer_tags;
      if (!_.isObject(tags)) {
        tags = JSON.parse(tags);
      }

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

      return o;
    }).filter(function (model) {
      return model.filter.length > 0;
    });

    this.reset(models);
  },

  buildQuery: function (options) {
    return MEASUREMENTS_QUERY_WITH_FILTERS;
  }
});
