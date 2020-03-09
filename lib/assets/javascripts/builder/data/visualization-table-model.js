var Backbone = require('backbone');
var _ = require('underscore');
var TableModel = require('./table-model');
var PermissionModel = require('./permission-model');
var SynchronizationModel = require('./synchronization-model');

/**
 * Model that represents a table visualization (v3)
 *
 */

var PRIVACY_OPTIONS = ['PUBLIC', 'LINK', 'PRIVATE'];

module.exports = Backbone.Model.extend({

  urlRoot: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('visualization');
    return baseUrl + '/api/' + version + '/viz';
  },

  initialize: function (attrs, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    this._configModel = opts.configModel;

    this._initModels();
  },

  _initModels: function () {
    var d = this.get('table');
    if (!_.isEmpty(this.get('external_source'))) {
      d = this.get('external_source');
    }
    this._tableModel = new TableModel(d, {
      configModel: this._configModel,
      parse: true
    });

    if (this.get('permission')) {
      this._permissionModel = new PermissionModel(this.get('permission'), {
        configModel: this._configModel
      });
      this.unset('permission');
    }

    if (this.get('synchronization')) {
      this._synchronizationModel = new SynchronizationModel(this.get('synchronization'), {
        configModel: this._configModel
      });
      this._synchronizationModel.linkToTable(this._tableModel);
    }
  },

  isVisualization: function () {
    return false;
  },

  getTableModel: function () {
    return this._tableModel;
  },

  getPermissionModel: function () {
    return this._permissionModel;
  },

  getSynchronizationModel: function () {
    return this._synchronizationModel;
  },

  vizjsonURL: function () {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('vizjson', 'read', 'v3');
    return baseUrl + '/api/' + version + '/viz/' + this.id + '/viz.json';
  },

  isRaster: function () {
    return this.get('kind') === 'raster';
  },

  datasetURL: function () {
    var baseUrl = this._configModel.get('base_url');
    var tableName = this.getTableModel().getUnquotedName();
    return baseUrl + '/dataset/' + tableName;
  },

  privacyOptions: function () {
    return PRIVACY_OPTIONS;
  },

  toJSON: function () {
    return _.omit(this.attributes, 'synchronization', 'stats', 'table');
  }
});
