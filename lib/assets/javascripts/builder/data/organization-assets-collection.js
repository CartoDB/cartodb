var Backbone = require('backbone');
var AssetModel = require('./asset-model');
var checkAndBuildOpts = require('builder/helpers/required-opts');

var REQUIRED_OPTS = [
  'configModel',
  'orgId'
];

module.exports = Backbone.Collection.extend({
  model: AssetModel,

  url: function (method) {
    var baseUrl = this._configModel.get('base_url');
    var version = this._configModel.urlVersion('organization-assets', method);
    return baseUrl + '/api/' + version + '/organization/' + this._orgId + '/assets';
  },

  initialize: function (models, opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  deselectAll: function (m) {
    this.each(function (mdl) {
      if (mdl !== m && mdl.get('state') === 'selected') {
        mdl.set('state', '');
      }
    });
  }

});
