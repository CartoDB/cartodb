const Backbone = require('backbone');
const IconModel = require('./organization-icon-model');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'orgId',
  'configModel'
];

module.exports = Backbone.Collection.extend({
  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  model: function (attrs, opts) {
    const options = { ...opts, configModel: opts.collection._configModel };

    return new IconModel(attrs, options);
  },

  url: function (method) {
    const version = this._configModel.urlVersion('organization-assets', method);

    return `/api/${version}/organization/${this._orgId}/assets`;
  }
});
