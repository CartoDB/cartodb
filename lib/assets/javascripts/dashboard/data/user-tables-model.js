const Backbone = require('backbone');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];

const PARAMS = {
  tag_name: '',
  q: '',
  page: 1,
  type: '',
  exclude_shared: false,
  per_page: 20,
  tags: '',
  shared: 'no',
  only_liked: false,
  order: 'updated_at',
  types: 'table',
  deepInsights: false
};

const DEFAULT_ATTRS = {
  select: false,
  update: false,
  insert: false,
  delete: false
};

module.exports = Backbone.Model.extend({

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  url: function () {
    const urlParams = Object.entries(PARAMS).map(([key, val]) => `${key}=${encodeURIComponent(val)}`).join('&');

    return `${this._userModel.get('base_url')}/api/v1/viz?${urlParams}`;
  },

  parse: function (response) {
    const tables = response.visualizations;

    return tables.reduce((total, table) => ({
      ...total,
      [table.name]: {
        permissions: DEFAULT_ATTRS
      }
    }), {});
  }
});
