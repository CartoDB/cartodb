const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'configModel'
];

/**
 *  Check if service token is valid
 *
 *  - It needs a datasource name or it won't work.
 *
 */

module.exports = Backbone.Model.extend({
  idAttribute: 'datasource',

  initialize: function (attributes, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  url: function (method) {
    const version = this._configModel.urlVersion('imports_service', method);
    return `/api/${version}/imports/service/${this.get(this.idAttribute)}/token_valid`;
  }
});
