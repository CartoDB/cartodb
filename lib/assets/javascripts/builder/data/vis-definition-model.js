var _ = require('underscore');
var Backbone = require('backbone');
var PermissionModel = require('./permission-model');

/**
 * Model that represents a visualization (v3)
 *
 * Even though a table might be represented as a Visualization in some cases, please use TableModel if you want to work
 * with the table data instead of adding table-specific methods here.
 */

var PRIVACY_OPTIONS = {
  public: 'PUBLIC',
  link: 'LINK',
  private: 'PRIVATE',
  password: 'PASSWORD'
};

module.exports = Backbone.Model.extend({
  defaults: {
    visChanges: 0
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');

    this._configModel = opts.configModel;

    if (this.get('permission')) {
      this._permissionModel = new PermissionModel(this.get('permission'), {
        configModel: opts.configModel
      });
      this.unset('permission');
    }
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

  stateURL: function () {
    var baseUrl = this._configModel.get('base_url');
    return baseUrl + '/api/v3/viz/' + this.id + '/state';
  },

  isVisualization: function () {
    return this.get('type') === 'derived';
  },

  privacyOptions: function () {
    return _.values(PRIVACY_OPTIONS);
  },

  recordChange: function () {
    var visChanges = this.get('visChanges');
    this.set('visChanges', visChanges + 1);
  },

  resetChanges: function () {
    this.set('visChanges', 0);
  },

  getPermissionModel: function () {
    return this._permissionModel;
  }
}, {
  isPubliclyAvailable: function (privacyStatus) {
    return privacyStatus === PRIVACY_OPTIONS.password ||
           privacyStatus === PRIVACY_OPTIONS.link ||
           privacyStatus === PRIVACY_OPTIONS.public;
  }
});
