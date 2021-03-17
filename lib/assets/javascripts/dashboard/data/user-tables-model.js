const _ = require('underscore');
const $ = require('jquery');
const Backbone = require('backbone');
const checkAndBuildOpts = require('builder/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];

const PUBLIC_PRIVACIES = ['PUBLIC', 'LINK'];

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

  initialize: function (attrs, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

    this.stateModel = new Backbone.Model({
      status: STATUS.fetching
    });

    this.paramsModel = new Backbone.Model({
      tag_name: '',
      q: '',
      page: 1,
      type: '',
      exclude_shared: true,
      tags: '',
      shared: 'no',
      only_liked: false,
      order: 'updated_at',
      types: 'table',
      deepInsights: false,
      load_do_totals: true
    });

    this._initBinds();
  },

  _initBinds: function () {
    this.listenTo(this.paramsModel, 'change:q change:privacy', () => this.fetch());

    this.on('sync', () => this.stateModel.set({ status: STATUS.fetched }));
    this.on('error', () => this.stateModel.set({ status: STATUS.errored }));
  },

  url: function () {
    return `${this._userModel.get('base_url')}/api/v1/viz?${this.generateParams()}`;
  },

  generateParams: function () {
    return $.param(this.paramsModel.attributes);
  },

  fetch: function () {
    this.stateModel.set({ status: STATUS.fetching });
    return Backbone.Model.prototype.fetch.apply(this, arguments);
  },

  parse: function (response) {
    this.attributes = {};

    const tables = response.visualizations;

    return tables.reduce((total, table) => ({
      ...total,
      [table.name]: {
        permissions: {
          ...DEFAULT_ATTRS,
          select: this.paramsModel.get('privacy') ? _.contains(PUBLIC_PRIVACIES, table.privacy) : false
        }
      }
    }), {});
  },

  setQuery: function (q) {
    this.paramsModel.set({ q });
  },

  clearParams: function () {
    this.paramsModel.set({ q: '' });
    this.paramsModel.unset('privacy');
  },

  getStateModel: function () {
    return this.stateModel;
  },

  isFetched: function () {
    return this.stateModel.get('status') === STATUS.fetched;
  },

  hasQuery: function () {
    return !!this.paramsModel.get('q');
  },

  isEmpty: function () {
    return _.isEmpty(this.attributes);
  },

  fetchPublicDatasets: function () {
    this.paramsModel.set({
      privacy: ['public', 'link'],
      per_page: 200 // TODO: how do we show everything?
    });
  }
});
