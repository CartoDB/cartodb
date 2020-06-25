const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

module.exports = Backbone.Model.extend({
  initialize: function (opts) {
    checkAndBuildOpts(opts, REQUIRED_OPTS, this);
  },

  isUserAuthentication: function () {
    return !!this._configModel.get('oauth_bigquery');
  },

  isServiceAuthentication: function () {
    return this._configModel.get('bigquery_uses_service_auth');
  },

  hasAnyAuthMethod: function () {
    return this.isUserAuthentication() || this.isServiceAuthentication();
  }
});
