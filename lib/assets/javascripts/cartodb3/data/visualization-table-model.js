var cdb = require('cartodb-deep-insights.js');
var _ = require('underscore');
var TableModel = require('./table-model');
var PermissionModel = require('./permission-model');
var SynchronizationModel = require('./synchronization-model');
var LikesModel = require('../components/likes/likes-model');

/**
 * Model that represents a table visualization (v3)
 *
 */
module.exports = cdb.core.Model.extend({

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
      configModel: this._configModel
    });

    this._permissionModel = new PermissionModel(this.get('permission'), {
      configModel: this._configModel
    });

    this._likesModel = LikesModel.newByVisData({
      vis_id: this.id,
      liked: this.get('liked'),
      likes: this.get('likes'),
      configModel: this._configModel
    });

    if (this.get('synchronization')) {
      this._synchronizationModel = new SynchronizationModel(this.get('synchronization'), {
        configModel: this._configModel
      });
      this._synchronizationModel.linkToTable(this._tableModel);
    }
  },

  getTableModel: function () {
    return this._tableModel;
  },

  getLikesModel: function () {
    return this._likesModel;
  },

  getPermissionModel: function () {
    return this._permissionModel;
  },

  getSynchronizationModel: function () {
    return this._synchronizationModel;
  },

  isRaster: function () {
    return this.get('kind') === 'raster';
  }
});
