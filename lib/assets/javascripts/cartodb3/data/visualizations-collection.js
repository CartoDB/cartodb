var _ = require('underscore');
var Backbone = require('backbone');
var VisualizationTableModel = require('./visualization-table-model');
var VisualizationModel = require('./vis-definition-model');

/**
 * A collection that holds visualization models
 */
module.exports = Backbone.Collection.extend({

  DEFAULT_FETCH_OPTIONS: {
    type: 'table',
    order: 'updated_at',
    page: 1,
    per_page: 20,
    exclude_shared: false,
    exclude_raster: true,
    tags: '',
    q: ''
  },

  model: function (d, opts) {
    var configModel = opts.collection._configModel;
    var Klass;

    if (d.type !== 'derived') {
      Klass = VisualizationTableModel;
    } else {
      Klass = VisualizationModel;
    }

    return new Klass(d, {
      configModel: configModel
    });
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    this._configModel = opts.configModel;

    // this.DEFAULT_FETCH_OPTIONS = _.extendOwn(this.DEFAULT_FETCH_OPTIONS, opts);
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
    opts.data = _.extend({}, this.DEFAULT_FETCH_OPTIONS, opts.data);
    return Backbone.Collection.prototype.fetch.call(this, opts);
  },

  getDefaultParam: function (param) {
    return this.DEFAULT_FETCH_OPTIONS[param];
  },

  getTotalStat: function (attribute) {
    return this._stats[attribute] || 0;
  },

  parse: function (res) {
    this._stats = _.omit(res, 'visualizations');
    return res.visualizations;
  }
});
