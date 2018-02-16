var _ = require('underscore');
var BaseCollection = require('./data-observatory-base-collection');
var BaseModel = require('builder/components/custom-list/custom-list-item-model');

var MEASUREMENTS_QUERY_WITH_REGION = 'SELECT numer_id, numer_name, numer_description, numer_type, numer_aggregate, numer_tags FROM _OBS_GetNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), section_tags => {{{ region }}}) ORDER BY numer_name ASC';

var MEASUREMENTS_QUERY_WITH_FILTERS = 'SELECT numer_id, numer_name, numer_description, numer_type, numer_aggregate, numer_tags FROM _OBS_GetNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), section_tags => {{{ region }}}, subsection_tags => {{{ filters }}})';

var MEASUREMENTS_QUERY_SEARCH = "SELECT numer_id, numer_name, numer_description, numer_type, numer_aggregate, numer_tags FROM _OBS_GetNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), section_tags => {{{ region }}}, name => '{{{ search }}}')";

var MEASUREMENTS_QUERY_SEARCH_AND_FILTERS = "SELECT numer_id, numer_name, numer_description, numer_type, numer_aggregate, numer_tags FROM _OBS_GetNumerators((SELECT ST_SetSRID(ST_Extent(the_geom), 4326) FROM ({{{ query }}}) q), section_tags => {{{ region }}} , name => '{{{ search }}}', subsection_tags => {{{ filters }}})";

module.exports = BaseCollection.extend({
  model: function (attrs, opts) {
    return new BaseModel(attrs, opts);
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
    if (options && options.search && options.filters) {
      return MEASUREMENTS_QUERY_SEARCH_AND_FILTERS;
    } else if (options && options.filters) {
      return MEASUREMENTS_QUERY_WITH_FILTERS;
    } else if (options && options.search) {
      return MEASUREMENTS_QUERY_SEARCH;
    } else {
      return MEASUREMENTS_QUERY_WITH_REGION;
    }
  },

  search: function () {
    return this;
  }
});
