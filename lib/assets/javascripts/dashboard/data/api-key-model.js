const Backbone = require('backbone');
const checkAndBuildOpts = require('cartodb3/helpers/required-opts');

const REQUIRED_OPTS = [
  'userModel'
];
const GRANT_TYPES = {
  APIS: 'apis',
  DATABASE: 'database'
};

module.exports = Backbone.Model.extend({
  defaults: {
    apis: {
      maps: false,
      sql: false
    }
  },

  initialize: function (models, options) {
    checkAndBuildOpts(options, REQUIRED_OPTS, this);
  },

  regenerate: function () {
    const options = {
      url: `${this.url()}/token/regenerate`,
      type: 'POST',
      success: (data) => this.set(data)
    };

    return this.sync(null, this, options);
  },

  parse: function (data) {
    const { grants, ...attrs } = data;
    const apis = this._parseApiGrants(grants);

    return { ...attrs, apis };
  },

  toJSON: function () {
    const { apis, ...attrs } = this.attributes;

    // TODO: Refactor
    const grants = [
      { type: GRANT_TYPES.APIS, apis: this.getApiGrants() },
      { type: GRANT_TYPES.DATABASE, tables: this.getTablesGrants() }
    ];

    return { ...attrs, grants };
  },

  getApiGrants: function () {
    const apis = this.get('apis');
    return Object.keys(apis).filter(name => apis[name]);
  },

  getTablesGrants: function () {
    // TODO: This is hardcoded
    return [
      {
        name: 'untitled_table_20',
        schema: 'public',
        permissions: [
          'select',
          'insert'
        ]
      }
    ];
  },

  _parseApiGrants: function (grants) {
    const apis = grants.find(grant => grant.type === GRANT_TYPES.APIS).apis;
    const apisObj = apis.reduce((total, item) => Object.assign(total, { [item]: true }), {});

    return Object.assign({}, this.defaults.apis, apisObj);
  }
});
