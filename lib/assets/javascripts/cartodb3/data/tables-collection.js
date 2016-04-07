var _ = require('underscore');
var Backbone = require('backbone');
var TableModel = require('./table-model');

var DEFAULT_FETCH_OPTIONS = {
  type: 'table',
  order: 'updated_at',
  page: 1,
  per_page: 20,
  exclude_shared: false,
  exclude_raster: true,
  tags: '',
  q: ''
};

/**
 * A collection that holds Table models
 */
module.exports = Backbone.Collection.extend({

  model: function (d, opts) {
    var configModel = opts.collection._configModel;
    return new TableModel(d, {
      configModel: configModel
    });
  },

  modelId: function (attrs) {
    return attrs.name;
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    this._configModel = opts.configModel;
    this._stats = {};
  },

  url: function () {
    var version = this._configModel.urlVersion('visualization');
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/' + version + '/viz';
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

  getTotalStat: function (attribute) {
    return this._stats[attribute] || 0;
  },

  parse: function (res) {
    this._stats = _.omit(res, 'visualizations');

    return _.map(res.visualizations, function (d) {
      var dt = d.table; // embedded table data in the vis response
      return {
        // From embedded table with same key/value
        id: dt.id,
        geometry_types: dt.geometry_types,
        name: dt.name,
        privacy: dt.privacy,

        // From embedded table with same value, but different key
        // so re-map them to match what's returned from a GET /tables/t-id
        rows_counted: dt.row_count,
        table_size: dt.size,
        table_type: d.type // table or remote
      };
    }, this);
  }
});
