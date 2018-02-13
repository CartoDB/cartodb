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

module.exports = Backbone.Model.extend({

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);

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

    this.listenTo(this.paramsModel, 'change:q', () => this.fetch());
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
    this.fetch();
  }
});
