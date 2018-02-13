const _ = require('underscore');
const Backbone = require('backbone');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];

const DEFAULT_ATTRS = {
  select: false,
  update: false,
  insert: false,
  delete: false
};

const STATUS = {
  fetching: 'fetching',
  fetched: 'fetched',
  errored: 'errored'
};

module.exports = Backbone.Model.extend({

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.stateModel = new Backbone.Model({
      status: STATUS.fetching
    });

    this.paramsModel = new Backbone.Model({
      tag_name: '',
      q: '',
      page: 1,
      type: '',
      exclude_shared: false,
      per_page: 10,
      tags: '',
      shared: 'no',
      only_liked: false,
      order: 'updated_at',
      types: 'table',
      deepInsights: false
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this.paramsModel, 'change:q', () => {
      this.stateModel.set({ status: STATUS.fetching });
      this.fetch();
    });

    this.on('sync', () => this.stateModel.set({ status: STATUS.fetched }));
    this.on('error', () => this.stateModel.set({ status: STATUS.errored }));
  },

  url: function () {
    return `${this._userModel.get('base_url')}/api/v1/viz?${this.generateParams()}`;
  },

  generateParams: function () {
    return _.pairs(this.paramsModel.attributes).map(([key, val]) => `${key}=${encodeURIComponent(val)}`).join('&');
  },

  parse: function (response) {
    this.attributes = {};

    const tables = response.visualizations;

    return tables.reduce((total, table) => ({
      ...total,
      [table.name]: {
        permissions: DEFAULT_ATTRS
      }
    }), {});
  },

  setQuery: function (q) {
    this.paramsModel.set({ q });
  },

  getStateModel: function () {
    return this.stateModel;
  },

  isFetched: function () {
    return this.stateModel.get('status') === STATUS.fetched;
  }
});
