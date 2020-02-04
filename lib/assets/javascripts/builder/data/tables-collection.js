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
      configModel: configModel,
      parse: true
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

  getDefaultParam: function (param) {
    return DEFAULT_FETCH_OPTIONS[param];
  },

  parse: function (res) {
    this._stats = _.omit(res, 'visualizations');

    var visualizations = res.visualizations;

    if (visualizations.length && visualizations[0].table) {
      return this._getVisualizationTableParams(visualizations);
    } else {
      return this._getVisualizationParams(visualizations);
    }
  },

  _getVisualizationTableParams: function (visualizations) {
    return _.map(visualizations, function (viz) {
      var table = viz.table;

      return {
        id: table.id,
        geometry_types: table.geometry_types,
        name: table.name,
        privacy: table.privacy,
        rows_counted: table.row_count,
        table_size: table.size,
        table_type: viz.type
      };
    }, this);
  },

  _getVisualizationParams: function (visualizations) {
    return _.map(visualizations, function (viz) {
      return {
        id: viz.id,
        name: viz.name,
        privacy: viz.privacy,
        table_type: viz.type
      };
    }, this);
  }
});
