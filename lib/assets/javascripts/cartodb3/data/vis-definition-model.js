var Backbone = require('backbone');

/**
 * Model that represents a visualization (v3)
 *
 * Even though a table might be represented as a Visualization in some cases, please use TableModel if you want to work
 * with the table data instead of adding table-specific methods here.
 */

var PRIVACY_OPTIONS = ['PUBLIC', 'LINK', 'PRIVATE', 'PASSWORD'];

module.exports = Backbone.Model.extend({

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;
  },

  urlRoot: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('visualization');
    return baseUrl + '/api/' + version + '/viz';
  },

  mapcapsURL: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this.id + '/mapcaps';
  },

  embedURL: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/builder/' + this.id + '/embed';
  },

  builderURL: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/builder/' + this.id + '/';
  },

  vizjsonURL: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('vizjson', 'read', 'v3');
    return baseUrl + '/api/' + version + '/viz/' + this.id + '/viz.json';
  },

  isVisualization: function () {
    return this.get('type') === 'derived';
  },

  privacyOptions: function () {
    return PRIVACY_OPTIONS;
  }
});
