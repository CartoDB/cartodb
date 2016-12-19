var Backbone = require('backbone');
var AssetModel = require('./asset-model');

module.exports = Backbone.Collection.extend({
  model: AssetModel,

  url: function (method) {
    // var version = cdb.config.urlVersion('asset', method);
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('asset', method);
    return baseUrl + '/api/' + version + '/users/' + this._userModel.get('id') + '/assets';
  },

  initialize: function (models, opts) {
    if (!opts.configModel) throw new Error('configModel is required');
    if (!opts.userModel) throw new Error('userModel is required');

    this._configModel = opts.configModel;
    this._userModel = opts.userModel;
  },

  parse: function (resp, xhr) {
    return resp.assets;
  }
});
