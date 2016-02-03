var _ = require('underscore');
var Backbone = require('backbone');
var TableModel = require('./table-model');

var DEFAULT_FETCH_OPTIONS = {
  type: 'table',
  page: 1,
  per_page: 9,
  exclude_shared: false,
  tag_name: '',
  q: ''
};

/**
 * A collection that holds Table models
 */
module.exports = Backbone.Collection.extend({

  initialize: function (models, opts) {
    if (!opts.baseUrl) throw new Error('baseUrl is required');
    this._baseUrl = opts.baseUrl;
  },

  url: function () {
    // Due to legacy reasons there is no tables endpoint per se.
    // Instead, tables are retrieved through visualizations search API endpoint
    // To get around the fact that that endpoint don't return all data expected here, the models will be created and
    // flagged as incomplete (see parse method), so one need to check for this flag where a table is wanted, to make
    // sure it's fetched where necessary.
    var version = cdb.config.apiUrlVersion('visualizations'); // eslint-disable-line
    return _.result(this, '_baseUrl') + '/api/' + version + '/viz';
  },

  // Overrides the default fetch, to use the internal methods to construct parmas
  fetch: function (opts) {
    opts = opts || {
      data: {
        // If reaches this code path it's because there were no opts given, i.e. should do a 'full fetch'
        // Since there is no current way to really do a full fetch let's just set a really high number to get all…
        // TODO this is obviously bad for organization users, how can we do this differently
        per_page: 1000
      }
    };
    opts.data = _.extend({}, DEFAULT_FETCH_OPTIONS, opts.data);
    return Backbone.Collection.prototype.fetch.call(this, opts);
  },

  parse: function (response) {
    return _.map(response.visualizations, function (d) {
      var dt = d.table; // embedded table data in the vis response
      return new TableModel({
        // From embedded table with same key/value
        id: dt.id,
        geometry_types: dt.geometry_types,
        name: dt.name,
        privacy: dt.privacy,

        // From embedded table with same value, but different key
        // so re-map them to match what's returned from a GET /tables/t-id
        rows_counted: dt.row_count,
        table_size: dt.size
      }, {
        baseUrl: this._baseUrl
      });
    }, this);
  }

});
