const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'datasourceName',
  'configModel'
];

/**
 *  Get oauth url from the service requested
 *
 *  - It needs a datasource name or it won't work.
 *
 *  new ServiceOauthModel({ datasourceName: 'dropbox', configModel })
 */

module.exports = Backbone.Model.extend({
  _datasourceName: 'dropbox',

  initialize: function (attributes, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  url: function (method) {
    const version = this._configModel.urlVersion('imports_service', method);
    return `/api/${version}/imports/service/${this._datasourceName}/auth_url`;
  },

  parse: function (response) {
    return response;
  }
});
