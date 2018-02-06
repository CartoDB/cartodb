const Backbone = require('backbone');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');
const ApiKeyModel = require('dashboard/data/api-key-model');

const REQUIRED_OPTS = [
  'userModel'
];
const TYPES = {
  MASTER: 'master',
  DEFAULT: 'default',
  REGULAR: 'regular'
};

module.exports = Backbone.Collection.extend({

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  url: function () {
    return `${this._userModel.get('base_url')}/api/v3/api_keys`;
  },

  model: function (attrs, opts) {
    const attributes = Object.assign(attrs, { id: attrs.name }); // We are using the name as an unique id
    const options = Object.assign(opts, { userModel: opts.collection._userModel });

    return new ApiKeyModel(attributes, options);
  },

  parse: function (response) {
    return response.result;
  },

  getMasterKey: function () {
    return this.findWhere({ type: TYPES.MASTER });
  },

  getDefaultKey: function () {
    return this.findWhere({ type: TYPES.DEFAULT });
  },

  getRegularKeys: function () {
    return this.where({ type: TYPES.REGULAR });
  }
});
