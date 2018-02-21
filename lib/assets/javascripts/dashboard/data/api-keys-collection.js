const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const ApiKeyModel = require('dashboard/data/api-key-model');

const REQUIRED_OPTS = [
  'userModel'
];

const TYPES = {
  MASTER: 'master',
  DEFAULT: 'default',
  REGULAR: 'regular'
};

const STATUS = {
  fetching: 'fetching',
  fetched: 'fetched',
  errored: 'errored'
};

module.exports = Backbone.Collection.extend({
  defaults: {
    status: STATUS.fetching
  },

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.on('sync', () => { this.status = STATUS.fetched; });
    this.on('error', () => { this.status = STATUS.errored; });
  },

  url: function () {
    return `${this._userModel.get('base_url')}/api/v3/api_keys`;
  },

  fetch: function () {
    const options = {
      headers: {
        'Authorization': `Basic ${this._userModel.getAuthToken()}`
      }
    };

    Backbone.Collection.prototype.fetch.call(this, options);
  },

  model: function (attrs, opts) {
    const options = Object.assign(opts, { userModel: opts.collection._userModel });

    return new ApiKeyModel(attrs, options);
  },

  parse: function (response) {
    const apiKeys = response.result;

    return apiKeys.map(key => Object.assign(key, { id: key.name })); // We are using the name as an unique id
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
