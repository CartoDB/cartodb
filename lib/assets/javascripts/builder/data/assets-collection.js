var Backbone = require('backbone');
var AssetModel = require('./asset-model');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'userModel'
];

module.exports = Backbone.Collection.extend({
  model: AssetModel,

  url: function (method) {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('asset', method);
    return baseUrl + '/api/' + version + '/users/' + this._userModel.get('id') + '/assets';
  },

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  parse: function (resp, xhr) {
    return resp.assets;
  },

  selectAll: function () {
    this.each(function (mdl) {
      mdl.set('state', 'selected');
    });
  },

  deselectAll: function (m) {
    this.each(function (mdl) {
      if (mdl !== m && mdl.get('state') === 'selected') {
        mdl.set('state', '');
      }
    });
  }
});
