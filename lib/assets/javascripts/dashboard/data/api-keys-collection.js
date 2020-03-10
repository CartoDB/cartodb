const $ = require('jquery'); require('jquery-migrate');
const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');
const ApiKeyModel = require('dashboard/data/api-key-model');
const apiKeysCollectionTypes = require('dashboard/data/api-keys-collection-types');
const PaginationModel = require('builder/components/pagination/pagination-model');

const REQUIRED_OPTS = [
  'userModel'
];

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

    this._type = options.type || [apiKeysCollectionTypes.REGULAR];
    this._paginationModel = new PaginationModel({
      per_page: 5,
      current_page: 1
    });

    this.on('sync', this._onCollectionSync);
    this.on('error', () => { this.status = STATUS.errored; });
    this.listenTo(this._paginationModel, 'change:current_page', this.fetch);
  },

  url: function () {
    const urlParams = {
      per_page: this._paginationModel.get('per_page'),
      page: this._paginationModel.get('current_page'),
      type: this._type
    };

    return `${this._userModel.get('base_url')}/api/v3/api_keys?${$.param(urlParams)}`;
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
    const options = { ...opts, userModel: opts.collection._userModel };

    return new ApiKeyModel(attrs, options);
  },

  parse: function ({ result, ...stats }) {
    this._stats = stats;

    return result.map(key => ({ ...key, id: key.name })); // We are using the name as an unique id
  },

  _onCollectionSync: function () {
    this.status = STATUS.fetched;

    this._paginationModel.set({
      total_count: this._getTotalPages()
    });
  },

  _getTotalPages: function (attribute) {
    return (this._stats && this._stats.total) || 0;
  },

  getPaginationModel: function () {
    return this._paginationModel;
  }
});
